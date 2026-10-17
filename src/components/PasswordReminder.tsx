import { Link, useLocation } from 'react-router'
import { useAuth } from '../state/useAuth'
import styles from './ContentUpdate.module.css'

/** Shown everywhere until the user replaces a temporary password from the admin. */
export function PasswordReminder() {
  const { profile } = useAuth()
  const { pathname } = useLocation()
  if (!profile?.must_change_password || pathname === '/me') return null
  return (
    <div className={styles.bar} role="status">
      <span>You are using a temporary password.</span>
      <Link to="/me#password" className="btn btn-primary">
        Choose your own
      </Link>
    </div>
  )
}
