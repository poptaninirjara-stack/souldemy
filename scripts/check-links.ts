// Checks every Further reading URL and writes LINK_REPORT.md. Reports only; never edits URLs.
// Run: npm run check-links
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { FILES, parseAll } from './lib/parse.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const TIMEOUT_MS = 20_000
const UA = 'Mozilla/5.0 (link check for a non-commercial study app)'

/** Institution named in a label → host it should live on. */
const INSTITUTIONS: [RegExp, string][] = [
  [/purdue/i, 'purdue.edu'],
  [/\bUNC\b/, 'unc.edu'],
  [/texas a&m/i, 'tamu.edu'],
  [/\bUNLV\b/, 'unlv.edu'],
  [/blinn/i, 'blinn.edu'],
  [/\bUTS\b/, 'uts.edu.au'],
  [/university of iowa/i, 'uiowa.edu'],
  [/manchester/i, 'manchester.ac.uk'],
  [/inflibnet|n-list|shodhganga/i, 'inflibnet.ac.in'],
  [/delnet/i, 'delnet.in'],
  [/\bMIT\b/, 'mit.edu'],
  [/montana state/i, 'montana.edu'],
  [/utah state/i, 'usu.edu'],
  [/holy cross/i, 'holycross.edu'],
  [/lipscomb/i, 'lipscomb.edu'],
  [/montclair/i, 'montclair.edu'],
  [/james madison/i, 'jmu.edu'],
  [/cincinnati/i, 'uc.edu'],
  [/washu|mckelvey/i, 'washu.edu'],
  [/northern illinois/i, 'niu.edu'],
  [/chinese university of hong kong/i, 'cuhk.edu.hk'],
  [/university of bath/i, 'bath.ac.uk'],
  [/university of washington/i, 'washington.edu'],
  [/leonardo english/i, 'leonardoenglish.com'],
  [/pearson/i, 'pearson.com'],
  [/csu chico/i, 'csuchico.edu'],
]

const SECOND_LEVEL = new Set(['ac', 'edu', 'co', 'gov', 'org'])
/** Rough registrable domain: example.edu, example.ac.uk, example.edu.au. */
function siteOf(host: string): string {
  const parts = host.toLowerCase().replace(/^www\./, '').split('.')
  const n = parts.length >= 3 && SECOND_LEVEL.has(parts[parts.length - 2]) ? 3 : 2
  return parts.slice(-n).join('.')
}

const hostMatches = (host: string, expected: string) => host === expected || host.endsWith('.' + expected)

function expectedHost(title: string, source: string): string | undefined {
  // The link's own label wins (e.g. "CSU Chico … as explained by [Montana State University Library]").
  for (const text of [title, source]) {
    const hit = INSTITUTIONS.find(([re]) => re.test(text))
    if (hit) return hit[1]
  }
  return undefined
}

interface Row {
  module: string
  label: string
  url: string
  status: string
  finalUrl?: string
  flags: string[]
}

async function request(url: string, method: 'HEAD' | 'GET') {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(url, { method, redirect: 'follow', signal: ctrl.signal, headers: { 'user-agent': UA } })
    if (method === 'GET') await res.body?.cancel()
    return res
  } finally {
    clearTimeout(t)
  }
}

async function check(module: string, title: string, source: string, url: string): Promise<Row> {
  const flags: string[] = []
  const label = source ? `${source}: ${title}` : title
  const host = new URL(url).hostname.toLowerCase()
  const want = expectedHost(title, source)
  if (want && !hostMatches(host.replace(/^www\./, ''), want)) flags.push(`label names ${want} but link is on ${host}`)
  if (/[A-Z]/.test(url.split('/')[2] ?? '')) flags.push('host written in capitals (works, but unusual)')

  let res: Response | undefined
  let error = ''
  try {
    res = await request(url, 'HEAD')
    if (res.status >= 400) res = await request(url, 'GET')
  } catch (e) {
    try {
      res = await request(url, 'GET')
    } catch (e2) {
      const err = e2 as Error & { cause?: { code?: string; message?: string } }
      error =
        err.name === 'AbortError'
          ? `timeout after ${TIMEOUT_MS / 1000}s`
          : [err.message ?? String(e), err.cause?.code ?? err.cause?.message].filter(Boolean).join(': ')
    }
  }
  if (!res) return { module, label, url, status: `ERROR (${error})`, flags: [...flags, 'unreachable'] }

  const finalUrl = res.url && res.url !== url ? res.url : undefined
  if (finalUrl) {
    const finalHost = new URL(finalUrl).hostname
    if (siteOf(finalHost) !== siteOf(host)) flags.push(`redirects to a different domain (${finalHost})`)
  }
  if (res.status >= 400) flags.push(res.status === 403 ? 'blocked automated check (403); verify by hand' : 'broken')
  return { module, label, url, status: String(res.status), finalUrl, flags }
}

async function main() {
  const src = (f: string) => readFileSync(join(root, 'content', f), 'utf8')
  const { catalog } = parseAll({ module1: src(FILES.module1), module2: src(FILES.module2), communication: src(FILES.communication) })

  const jobs: Promise<Row>[] = []
  for (const t of catalog.tracks)
    for (const m of t.modules)
      for (const item of m.furtherReading.items)
        for (const l of item.links) jobs.push(check(`${m.id} ${m.title}`, l.title, item.source, l.url))

  const rows = await Promise.all(jobs)
  const flagged = rows.filter((r) => r.flags.length)
  const esc = (s: string) => s.replace(/\|/g, '\\|')

  const md = [
    '# Link report',
    '',
    `Generated by \`npm run check-links\` on ${new Date().toISOString().slice(0, 10)}. HEAD request with GET fallback, ${TIMEOUT_MS / 1000}s timeout, redirects followed. **Report only: no URL in /content was changed.**`,
    '',
    `${rows.length} links checked; ${rows.filter((r) => /^[23]/.test(r.status)).length} answered 2xx/3xx; ${flagged.length} flagged.`,
    '',
    '## Flagged',
    '',
    flagged.length ? '| Module | Label | URL | Status | Flags |\n|---|---|---|---|---|' : 'None.',
    ...flagged.map((r) => `| ${esc(r.module)} | ${esc(r.label)} | ${r.url} | ${r.status} | ${esc(r.flags.join('; '))} |`),
    '',
    '## All links',
    '',
    '| Module | Label | Status | URL | Redirects to |',
    '|---|---|---|---|---|',
    ...rows.map((r) => `| ${esc(r.module)} | ${esc(r.label)} | ${r.status} | ${r.url} | ${r.finalUrl ?? ''} |`),
    '',
    'Note: some university sites refuse automated requests (403) or are slow from outside their region. A flag here means "check by hand", not necessarily "broken".',
    '',
  ].join('\n')

  writeFileSync(join(root, 'LINK_REPORT.md'), md)
  console.log(`Checked ${rows.length} links, ${flagged.length} flagged. Wrote LINK_REPORT.md.`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
