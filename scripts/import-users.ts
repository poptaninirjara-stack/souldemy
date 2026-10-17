// Creates (or updates) student and teacher accounts from a CSV file.
//
//   npm run import-users -- accounts/users.csv              create new accounts, skip existing
//   npm run import-users -- accounts/users.csv --update     also update name, role, class and password of existing ones
//   npm run import-users -- accounts/users.csv --dry-run    check the file without changing anything
//
// Columns: username, full_name, role (student | teacher | admin), password, class (optional).
// Passwords must be at least 8 characters. Classes are created as needed.
// Keep real CSVs in accounts/ — that folder is git-ignored apart from the example.
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { adminClient } from './lib/admin.ts'
import { parseCsvObjects } from './lib/csv.ts'

// Must match src/lib/supabase.ts.
const LOGIN_EMAIL_DOMAIN = 'users.souldemy.app'
const ROLES = ['student', 'teacher', 'admin']
const USERNAME = /^[a-z0-9][a-z0-9._-]{1,39}$/

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const args = process.argv.slice(2)
const file = args.find((a) => !a.startsWith('--'))
const dryRun = args.includes('--dry-run')
const update = args.includes('--update')

interface Row {
  line: number
  username: string
  full_name: string
  role: string
  password: string
  class: string
}

function fail(msg: string): never {
  console.error(msg)
  process.exit(1)
}

if (!file) fail('Usage: npm run import-users -- <file.csv> [--update] [--dry-run]')

let text: string
try {
  text = readFileSync(file, 'utf8')
} catch {
  fail(`Cannot read ${file}.`)
}

const rows: Row[] = parseCsvObjects(text).map((r, i) => ({
  line: i + 2,
  username: (r.username ?? '').toLowerCase(),
  full_name: r.full_name ?? r.name ?? '',
  role: (r.role ?? 'student').toLowerCase() || 'student',
  password: r.password ?? '',
  class: r.class ?? '',
}))

// Check the whole file first, so a bad row never leaves a half-imported class.
const problems: string[] = []
const seen = new Set<string>()
for (const r of rows) {
  if (!USERNAME.test(r.username))
    problems.push(`line ${r.line}: username "${r.username}" must be 2–40 characters: lower-case letters, digits, dot, dash or underscore.`)
  if (seen.has(r.username)) problems.push(`line ${r.line}: username "${r.username}" appears twice.`)
  seen.add(r.username)
  if (!ROLES.includes(r.role)) problems.push(`line ${r.line}: role "${r.role}" must be one of ${ROLES.join(', ')}.`)
  if (r.password.length < 8) problems.push(`line ${r.line}: password for "${r.username}" must be at least 8 characters.`)
}
if (!rows.length) problems.push('No rows found. The first line must be the header: username,full_name,role,password,class')
if (problems.length) fail(`Nothing imported. Fix these and run again:\n  ${problems.join('\n  ')}`)

if (dryRun) {
  console.log(`File OK: ${rows.length} accounts (${ROLES.map((x) => `${rows.filter((r) => r.role === x).length} ${x}`).join(', ')}).`)
  process.exit(0)
}

const db = adminClient(root)

const { data: existing, error: exErr } = await db.from('profiles').select('id, username')
if (exErr) fail(`Cannot read profiles: ${exErr.message}. Has supabase/migrations been run?`)
const idByUsername = new Map(existing.map((p) => [p.username as string, p.id as string]))

const classIds = new Map<string, string>()
for (const name of new Set(rows.map((r) => r.class).filter(Boolean))) {
  const { data, error } = await db.from('classes').upsert({ name }, { onConflict: 'name' }).select('id').single()
  if (error) fail(`Cannot create class "${name}": ${error.message}`)
  classIds.set(name, data.id)
}

let created = 0
let updated = 0
let skipped = 0
const failed: string[] = []

for (const r of rows) {
  // A password from the CSV is temporary: the app asks the person to choose their own.
  const profile = { username: r.username, full_name: r.full_name, role: r.role, class_id: classIds.get(r.class) ?? null, must_change_password: true }
  let id = idByUsername.get(r.username)
  if (id && !update) {
    skipped++
    continue
  }
  if (id) {
    const { error } = await db.auth.admin.updateUserById(id, { password: r.password })
    if (error) {
      failed.push(`${r.username}: ${error.message}`)
      continue
    }
  } else {
    const { data, error } = await db.auth.admin.createUser({
      email: `${r.username}@${LOGIN_EMAIL_DOMAIN}`,
      password: r.password,
      email_confirm: true,
      user_metadata: { username: r.username },
    })
    if (error) {
      failed.push(`${r.username}: ${error.message}`)
      continue
    }
    id = data.user.id
  }
  const { error } = await db.from('profiles').upsert({ id, ...profile })
  if (error) {
    failed.push(`${r.username}: account exists but profile failed: ${error.message}`)
    continue
  }
  if (idByUsername.has(r.username)) updated++
  else created++
}

console.log(`Created ${created}, updated ${updated}, skipped ${skipped} existing${update ? '' : ' (use --update to change them)'}.`)
if (failed.length) fail(`Failed (${failed.length}):\n  ${failed.join('\n  ')}`)
