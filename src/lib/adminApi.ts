// Calls the admin-users Edge Function (supabase/functions/admin-users). Each call returns
// an error message to show, or null on success.
import { supabase } from './supabase'

type Action =
  | { action: 'create'; username: string; full_name: string; role: string; password: string; class: string }
  | { action: 'set_password'; user_id: string; password: string }
  | { action: 'update'; user_id: string; username?: string; full_name?: string; role?: string; class?: string }
  | { action: 'delete'; user_id: string }

const SIGNED_OUT = 'You were signed out (your sign-in had expired). Sign in again, then try once more.'

/** A current access token, renewed first if it has expired or is about to. */
async function freshToken(): Promise<string | null> {
  const { data } = await supabase!.auth.getSession()
  const s = data.session
  if (!s) return null
  if (!s.expires_at || s.expires_at * 1000 - Date.now() > 60_000) return s.access_token
  const { data: r } = await supabase!.auth.refreshSession()
  return r.session?.access_token ?? null
}

const send = (body: Action, token: string) =>
  supabase!.functions.invoke('admin-users', { body, headers: { Authorization: `Bearer ${token}` } })

const statusOf = (error: unknown) => {
  const res = (error as { context?: unknown } | null)?.context
  return res instanceof Response ? res.status : 0
}

export async function adminCall(body: Action): Promise<string | null> {
  if (!supabase) return 'Accounts are not set up.'
  let token = await freshToken()
  let { error } = token ? await send(body, token) : { error: null as unknown }
  // The server did not accept the sign-in: renew it once and retry. If that fails too,
  // sign out properly so the page stops looking signed in.
  if (!token || statusOf(error) === 401) {
    const { data } = await supabase.auth.refreshSession()
    token = data.session?.access_token ?? null
    if (token) ({ error } = await send(body, token))
    if (!token || statusOf(error) === 401) {
      await supabase.auth.signOut({ scope: 'local' })
      return SIGNED_OUT
    }
  }
  if (!error) return null
  // The function answers errors as {error: "..."}; the client wraps the response.
  const res = (error as { context?: unknown }).context
  if (res instanceof Response) {
    try {
      const j = (await res.json()) as { error?: string }
      if (j.error) return j.error
    } catch {
      // not JSON
    }
    if (res.status === 404) return 'The admin-users function is not deployed yet (see the README).'
  }
  return 'Could not reach the server. Check your connection and try again.'
}

// Easy to read aloud and type on a phone: word-word-number, no look-alike characters.
const WORDS = [
  'mango', 'river', 'lotus', 'tiger', 'monsoon', 'chai', 'pepper', 'garden', 'kite', 'bridge', 'cotton', 'silver',
  'harbour', 'meadow', 'comet', 'saffron', 'banyan', 'pebble', 'lantern', 'orbit', 'maple', 'falcon', 'island', 'ember',
]

export function tempPassword(): string {
  const r = new Uint32Array(3)
  crypto.getRandomValues(r)
  return `${WORDS[r[0] % WORDS.length]}-${WORDS[r[1] % WORDS.length]}-${1000 + (r[2] % 9000)}`
}
