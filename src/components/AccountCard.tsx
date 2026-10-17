import { useState } from 'react'
import { Link } from 'react-router'
import { useAuth } from '../state/useAuth'
import { ChangePassword } from './ChangePassword'
import styles from './AccountCard.module.css'

const STATUS: Record<string, string> = {
  idle: '',
  saving: 'Saving to your account…',
  saved: 'All progress saved to your account.',
  offline: 'Offline. Your progress is safe on this device and will be saved to your account when you are back online.',
}

/** Signed-in state on the Me page: who you are, whether progress is saved, sign out. */
export function AccountCard() {
  const { enabled, session, profile, isStaff, isAdmin, syncStatus, signOut } = useAuth()
  const [busy, setBusy] = useState(false)
  if (!enabled) return null

  if (!session)
    return (
      <section className={styles.card} aria-labelledby="account-h">
        <h2 id="account-h" className={styles.h2}>
          Your account
        </h2>
        <p className="meta">Sign in with the username your college gave you to save your progress and use it on any device.</p>
        <Link to="/signin" className="btn btn-primary">
          Sign in
        </Link>
      </section>
    )

  return (
    <section className={styles.card} aria-labelledby="account-h">
      <h2 id="account-h" className={styles.h2}>
        {profile?.full_name || profile?.username || 'Your account'}
      </h2>
      <p className="meta">
        Signed in as <strong>{profile?.username ?? session.user.email}</strong>
        {profile && profile.role !== 'student' ? ` (${profile.role})` : ''}
      </p>
      <p className="caption" role="status">
        {STATUS[syncStatus]}
      </p>
      <div className={styles.row}>
        {isAdmin && (
          <Link to="/admin" className="btn btn-primary">
            Admin
          </Link>
        )}
        {isStaff && (
          <Link to="/teacher" className="btn btn-primary">
            Teacher view
          </Link>
        )}
        <button
          type="button"
          className="btn btn-secondary"
          aria-disabled={busy}
          onClick={async () => {
            if (busy) return
            setBusy(true)
            await signOut()
          }}
        >
          {busy ? 'Signing out…' : 'Sign out'}
        </button>
      </div>
      <ChangePassword />
      <p className="caption">Signing out removes your progress from this device. It stays in your account.</p>
    </section>
  )
}
