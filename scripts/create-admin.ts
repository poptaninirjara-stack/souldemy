// Creates the main admin account (run once). The admin then signs in to the app and
// manages every other account from the Admin page.
//
//   npm run create-admin -- <username> "<Full name>"
//
// A starting password is generated and printed once. Sign in with it; the app then asks
// you to choose your own. Needs SUPABASE_SECRET_KEY in .env.local.
// Running it again for an existing username makes that account an admin and gives it a new password.
import { randomInt } from 'node:crypto'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { adminClient } from './lib/admin.ts'

// Must match src/lib/supabase.ts.
const LOGIN_EMAIL_DOMAIN = 'users.souldemy.app'
const USERNAME = /^[a-z0-9][a-z0-9._-]{1,39}$/

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const [rawUsername, ...nameParts] = process.argv.slice(2)
const username = (rawUsername ?? '').trim().toLowerCase()
const fullName = nameParts.join(' ').trim()

if (!USERNAME.test(username)) {
  console.error('Usage: npm run create-admin -- <username> "<Full name>"\nUsernames are 2–40 characters: lower-case letters, digits, dot, dash or underscore.')
  process.exit(1)
}

const alphabet = 'abcdefghjkmnpqrstuvwxyz23456789'
const password = Array.from({ length: 4 }, () => Array.from({ length: 4 }, () => alphabet[randomInt(alphabet.length)]).join('')).join('-')

const db = adminClient(root)
const { data: existing, error: exErr } = await db.from('profiles').select('id').eq('username', username).maybeSingle()
if (exErr) {
  console.error(`Cannot read profiles: ${exErr.message}. Has supabase/migrations been run?`)
  process.exit(1)
}

let id = existing?.id as string | undefined
if (id) {
  const { error } = await db.auth.admin.updateUserById(id, { password })
  if (error) {
    console.error(`Could not set the password: ${error.message}`)
    process.exit(1)
  }
} else {
  const { data, error } = await db.auth.admin.createUser({
    email: `${username}@${LOGIN_EMAIL_DOMAIN}`,
    password,
    email_confirm: true,
    user_metadata: { username },
  })
  if (error) {
    console.error(`Could not create the account: ${error.message}`)
    process.exit(1)
  }
  id = data.user.id
}

const profile: Record<string, unknown> = { id, username, role: 'admin', must_change_password: true }
if (fullName || !existing) profile.full_name = fullName
const { error } = await db.from('profiles').upsert(profile)
if (error) {
  console.error(`Account exists but the profile failed: ${error.message}`)
  process.exit(1)
}

console.log(`${existing ? 'Updated' : 'Created'} admin "${username}".`)
console.log(`Starting password (shown once): ${password}`)
console.log('Sign in to the app with it; you will be asked to choose your own password.')
