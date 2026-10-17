// The one Supabase client. Null when the project is not configured (see .env) and in
// tests, so the app keeps working as a purely local app.
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { STORAGE_NAMESPACE } from '../config'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined

export const supabase: SupabaseClient | null =
  url && key && import.meta.env.MODE !== 'test'
    ? createClient(url, key, {
        auth: { storageKey: `${STORAGE_NAMESPACE.replace(/:v\d+:$/, '')}:auth`, persistSession: true, autoRefreshToken: true },
      })
    : null

/**
 * Supabase signs people in by email, so each username maps to an internal address on
 * a domain nobody receives mail for. Students only ever see and type the username.
 * scripts/import-users.ts uses the same rule.
 */
export const LOGIN_EMAIL_DOMAIN = 'users.souldemy.app'
export const usernameToEmail = (username: string) => `${username.trim().toLowerCase()}@${LOGIN_EMAIL_DOMAIN}`
