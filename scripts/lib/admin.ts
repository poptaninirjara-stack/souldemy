// Admin Supabase client for the scripts (import-users, publish-content). Uses the secret
// key, which bypasses row-level security, so it must only ever run on your machine or in CI.
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

export function adminClient(root: string): SupabaseClient {
  for (const f of ['.env', '.env.local']) {
    const p = join(root, f)
    if (existsSync(p)) process.loadEnvFile(p)
  }
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL
  const key = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url) throw new Error('Missing SUPABASE_URL (or VITE_SUPABASE_URL in .env).')
  if (!key) throw new Error('Missing SUPABASE_SECRET_KEY. Copy .env.local.example to .env.local and fill it in.')
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}
