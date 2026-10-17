// Calls the admin-users Edge Function (supabase/functions/admin-users). Each call returns
// an error message to show, or null on success.
import { supabase } from './supabase'

type Action =
  | { action: 'create'; username: string; full_name: string; role: string; password: string; class: string }
  | { action: 'set_password'; user_id: string; password: string }
  | { action: 'update'; user_id: string; full_name?: string; role?: string; class?: string }
  | { action: 'delete'; user_id: string }

export async function adminCall(body: Action): Promise<string | null> {
  if (!supabase) return 'Accounts are not set up.'
  const { error } = await supabase.functions.invoke('admin-users', { body })
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
