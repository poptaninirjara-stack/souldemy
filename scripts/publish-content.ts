// Publishes the built content (src/content, from /content via build-content.ts) to Supabase
// as a new version. Students' apps pick it up the next time they open the app.
//
//   npm run publish-content                      build, check and publish
//   ALLOW_REMOVED_IDS=1 npm run publish-content  publish even though some progress IDs disappeared
//
// Normally this runs in GitHub Actions on every push to main (.github/workflows/publish-content.yml).
// Roll back: delete the newest row in content_versions (Supabase → Table editor); the one before
// becomes the newest again.
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { adminClient } from './lib/admin.ts'

const KEEP_VERSIONS = 30

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dir = join(root, 'src', 'content')
const readJson = (p: string) => JSON.parse(readFileSync(join(dir, p), 'utf8'))

function fail(msg: string): never {
  console.error(msg)
  process.exit(1)
}

const meta = readJson('meta.json') as { hash: string }
const ids = readJson('ids.json') as string[]
const catalog = readJson('catalog.json')
const games = readJson('games.json')
const modules = readdirSync(join(dir, 'modules'))
  .filter((f) => f.endsWith('.json'))
  .map((f) => ({ module_id: f.replace(/\.json$/, ''), data: readJson(join('modules', f)) }))

const db = adminClient(root)

const { data: latest, error: latestErr } = await db
  .from('content_versions')
  .select('id, hash, ids')
  .order('id', { ascending: false })
  .limit(1)
  .maybeSingle()
if (latestErr) fail(`Cannot read content_versions: ${latestErr.message}. Has supabase/migrations been run?`)

if (latest?.hash === meta.hash) {
  console.log(`Content ${meta.hash} is already the published version (#${latest.id}). Nothing to do.`)
  process.exit(0)
}

// Stable IDs: saved progress points at these. Losing one silently loses students' work.
if (latest) {
  const now = new Set(ids)
  const removed = (latest.ids as string[]).filter((id) => !now.has(id))
  if (removed.length) {
    const msg =
      `${removed.length} ID(s) that students' progress may point at are gone since version #${latest.id}:\n  ${removed.join('\n  ')}\n` +
      'Most IDs come from headings, so this usually means a lesson, exercise, quiz or section heading was renamed or removed.\n' +
      'If that was intended, publish with ALLOW_REMOVED_IDS=1 (students keep their other progress).'
    if (process.env.ALLOW_REMOVED_IDS === '1') console.warn(`Warning: ${msg}`)
    else fail(`Not published. ${msg}`)
  }
}

const { data: version, error: vErr } = await db
  .from('content_versions')
  .insert({ hash: meta.hash, git_sha: process.env.GITHUB_SHA ?? null, catalog, games, ids })
  .select('id')
  .single()
if (vErr) fail(`Publish failed: ${vErr.message}`)

const { error: mErr } = await db.from('content_modules').insert(modules.map((m) => ({ version_id: version.id, ...m })))
if (mErr) {
  await db.from('content_versions').delete().eq('id', version.id)
  fail(`Publish failed while uploading modules (nothing was published): ${mErr.message}`)
}

// Keep the most recent versions for rollback; older ones go (their modules cascade).
const { data: old } = await db.from('content_versions').select('id').order('id', { ascending: false }).range(KEEP_VERSIONS, 1000)
if (old?.length) await db.from('content_versions').delete().in('id', old.map((o) => o.id))

console.log(`Published content ${meta.hash} as version #${version.id} (${modules.length} modules, ${ids.length} progress IDs).`)
