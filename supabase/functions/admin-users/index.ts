// Account management for the admin: create accounts, set or reset passwords, change
// name/role/class, delete. Runs on Supabase (Deno), where the secret key lives; the browser
// never sees it. Only a signed-in user whose profile role is 'admin' may call it.
//
// Deploy: npx supabase functions deploy admin-users --project-ref <project-ref>
// Called from src/lib/adminApi.ts.
import { createClient } from 'npm:@supabase/supabase-js@2'

// Must match src/lib/supabase.ts and scripts/import-users.ts.
const LOGIN_EMAIL_DOMAIN = 'users.souldemy.app'
const USERNAME = /^[a-z0-9][a-z0-9._-]{1,39}$/
const ROLES = ['student', 'teacher', 'admin']

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

class Problem extends Error {}
const check = (ok: unknown, msg: string) => {
  if (!ok) throw new Problem(msg)
}

const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
  auth: { persistSession: false, autoRefreshToken: false },
})

async function classId(name: unknown): Promise<string | null> {
  const n = typeof name === 'string' ? name.trim() : ''
  if (!n) return null
  check(n.length <= 80, 'Class names can be up to 80 characters.')
  const { data, error } = await db.from('classes').upsert({ name: n }, { onConflict: 'name' }).select('id').single()
  if (error) throw new Problem(`Could not save the class: ${error.message}`)
  return data.id
}

function checkPassword(p: unknown): string {
  check(typeof p === 'string' && p.length >= 8 && p.length <= 72, 'Passwords must be 8 to 72 characters.')
  return p as string
}

/** Close any open "forgot password" requests once the admin has set a new password. */
async function closeRequests(userId: string) {
  await db
    .from('password_reset_requests')
    .update({ status: 'done', resolved_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('status', 'open')
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'Use POST.' }, 405)

  const jwt = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '')
  const { data: auth } = jwt ? await db.auth.getUser(jwt) : { data: { user: null } }
  if (!auth.user) return json({ error: 'Your session has ended. Sign in again.' }, 401)
  const { data: me } = await db.from('profiles').select('role').eq('id', auth.user.id).maybeSingle()
  if (me?.role !== 'admin') return json({ error: 'Only the admin can manage accounts.' }, 403)
  const self = auth.user.id

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Bad request.' }, 400)
  }

  try {
    switch (body.action) {
      case 'create': {
        const username = String(body.username ?? '').trim().toLowerCase()
        check(USERNAME.test(username), 'Usernames are 2–40 characters: lower-case letters, digits, dot, dash or underscore.')
        const role = String(body.role ?? 'student')
        check(ROLES.includes(role), 'Role must be student, teacher or admin.')
        const password = checkPassword(body.password)
        const { data: taken } = await db.from('profiles').select('id').eq('username', username).maybeSingle()
        check(!taken, `The username "${username}" is already taken.`)
        const class_id = await classId(body.class)
        const { data, error } = await db.auth.admin.createUser({
          email: `${username}@${LOGIN_EMAIL_DOMAIN}`,
          password,
          email_confirm: true,
          user_metadata: { username },
        })
        if (error) throw new Problem(`Could not create the account: ${error.message}`)
        const { error: pErr } = await db.from('profiles').insert({
          id: data.user.id,
          username,
          full_name: String(body.full_name ?? '').trim().slice(0, 120),
          role,
          class_id,
          must_change_password: true,
        })
        if (pErr) {
          await db.auth.admin.deleteUser(data.user.id)
          throw new Problem(`Could not create the account: ${pErr.message}`)
        }
        return json({ id: data.user.id })
      }

      case 'set_password': {
        const id = String(body.user_id ?? '')
        const password = checkPassword(body.password)
        const { error } = await db.auth.admin.updateUserById(id, { password })
        if (error) throw new Problem(`Could not set the password: ${error.message}`)
        // A password the admin gives out is temporary, except the admin's own.
        await db.from('profiles').update({ must_change_password: id !== self }).eq('id', id)
        await closeRequests(id)
        return json({ ok: true })
      }

      case 'update': {
        const id = String(body.user_id ?? '')
        const patch: Record<string, unknown> = {}
        if (typeof body.full_name === 'string') patch.full_name = body.full_name.trim().slice(0, 120)
        if (typeof body.role === 'string') {
          check(ROLES.includes(body.role), 'Role must be student, teacher or admin.')
          check(id !== self || body.role === 'admin', 'You cannot remove your own admin role.')
          patch.role = body.role
        }
        if ('class' in body) patch.class_id = await classId(body.class)
        const { error } = await db.from('profiles').update(patch).eq('id', id)
        if (error) throw new Problem(`Could not save: ${error.message}`)
        return json({ ok: true })
      }

      case 'delete': {
        const id = String(body.user_id ?? '')
        check(id !== self, 'You cannot delete your own account.')
        // Their profile, progress, feedback links and recordings rows go with the account.
        const { error } = await db.auth.admin.deleteUser(id)
        if (error) throw new Problem(`Could not delete the account: ${error.message}`)
        return json({ ok: true })
      }

      default:
        return json({ error: 'Unknown action.' }, 400)
    }
  } catch (e) {
    if (e instanceof Problem) return json({ error: e.message }, 400)
    console.error(e)
    return json({ error: 'Something went wrong on the server.' }, 500)
  }
})
