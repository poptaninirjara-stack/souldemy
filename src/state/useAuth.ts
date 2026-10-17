// Accounts: username + password sign-in (accounts are created by scripts/import-users.ts),
// the signed-in profile, and progress sync. Signing in is optional; without it the app
// works exactly as before, on this device only.
import type { Session } from '@supabase/supabase-js'
import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { deleteAccountProgress, flush, onSyncStatus, startSync, stopSync, syncStatus, type SyncStatus } from '../lib/sync'
import { supabase, usernameToEmail } from '../lib/supabase'

export type Role = 'student' | 'teacher' | 'admin'

export interface Profile {
  id: string
  username: string
  full_name: string
  role: Role
  must_change_password: boolean
}

export function useAuthValue() {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  // Until the stored session has been checked and synced, the app should not render
  // progress (it may be about to change). Without Supabase there is nothing to wait for.
  const [ready, setReady] = useState(!supabase)
  /** Bumped when synced data replaced what was on the device, to re-read app state. */
  const [epoch, setEpoch] = useState(0)
  const [status, setStatus] = useState<SyncStatus>(syncStatus)

  useEffect(() => onSyncStatus(setStatus), [])

  const begin = useCallback(async (s: Session) => {
    const { data } = await supabase!.from('profiles').select('id, username, full_name, role, must_change_password').eq('id', s.user.id).maybeSingle()
    setProfile((data as Profile | null) ?? null)
    if (await startSync(s.user.id)) setEpoch((n) => n + 1)
  }, [])

  useEffect(() => {
    if (!supabase) return
    let live = true
    // On a slow connection, show the device copy rather than wait; the sync catches up.
    const patience = setTimeout(() => setReady(true), 2500)
    supabase.auth.getSession().then(async ({ data }) => {
      if (!live) return
      setSession(data.session)
      if (data.session) await begin(data.session).catch(() => undefined)
      if (live) setReady(true)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      if (event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') setSession(s)
      if (event === 'SIGNED_OUT') {
        setSession(null)
        setProfile(null)
      }
    })
    return () => {
      live = false
      clearTimeout(patience)
      sub.subscription.unsubscribe()
    }
  }, [begin])

  // Upload pending changes when the tab is hidden or closed, and pick up other devices'
  // work when the student comes back to the tab.
  useEffect(() => {
    if (!session) return
    let last = Date.now()
    const onVis = () => {
      if (document.visibilityState === 'hidden') void flush()
      else if (Date.now() - last > 60_000) {
        last = Date.now()
        startSync(session.user.id).then((changed) => changed && setEpoch((n) => n + 1), () => undefined)
      }
    }
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [session])

  const signIn = useCallback(
    async (username: string, password: string): Promise<string | null> => {
      if (!supabase) return 'Accounts are not set up for this copy of the app.'
      const { data, error } = await supabase.auth.signInWithPassword({ email: usernameToEmail(username), password })
      if (error || !data.session) {
        if (error && /invalid login credentials/i.test(error.message)) return 'That username and password do not match. Check them and try again.'
        return 'Could not sign in. Check your internet connection and try again.'
      }
      // Load the profile first, so the sign-in page can send admins straight to Admin.
      await begin(data.session)
      setSession(data.session)
      return null
    },
    [begin],
  )

  const signOut = useCallback(async () => {
    await stopSync()
    await supabase?.auth.signOut()
    setSession(null)
    setProfile(null)
    setEpoch((n) => n + 1)
  }, [])

  /** Change your own password. The current one is checked first (shared computers). */
  const changePassword = useCallback(
    async (current: string, next: string): Promise<string | null> => {
      if (!supabase || !session || !profile) return 'Sign in first.'
      if (next.length < 8) return 'Your new password must be at least 8 characters.'
      if (next === current) return 'Choose a password different from the current one.'
      const { error: wrong } = await supabase.auth.signInWithPassword({ email: usernameToEmail(profile.username), password: current })
      if (wrong) return /invalid login credentials/i.test(wrong.message) ? 'Your current password is not right.' : 'Could not check your password. Try again.'
      const { error } = await supabase.auth.updateUser({ password: next })
      if (error) return /weak|short|characters/i.test(error.message) ? error.message : 'Could not change your password. Try again.'
      await supabase.rpc('password_changed')
      setProfile((p) => (p ? { ...p, must_change_password: false } : p))
      return null
    },
    [session, profile],
  )

  /** "Forgot password": ask the admin for a new one. Always reports success (no username probing). */
  const requestReset = useCallback(async (username: string, note: string): Promise<string | null> => {
    if (!supabase) return 'Accounts are not set up for this copy of the app.'
    const { error } = await supabase.rpc('request_password_reset', { p_username: username, p_note: note })
    return error ? 'Could not send your request. Check your internet connection and try again.' : null
  }, [])

  return {
    enabled: !!supabase,
    ready,
    epoch,
    session,
    profile,
    isStaff: profile?.role === 'teacher' || profile?.role === 'admin',
    isAdmin: profile?.role === 'admin',
    syncStatus: status,
    signIn,
    signOut,
    changePassword,
    requestReset,
    deleteAccountProgress,
  }
}

export type Auth = ReturnType<typeof useAuthValue>

export const AuthContext = createContext<Auth | null>(null)

export function useAuth(): Auth {
  const v = useContext(AuthContext)
  if (!v) throw new Error('useAuth must be used inside <AuthProvider>')
  return v
}
