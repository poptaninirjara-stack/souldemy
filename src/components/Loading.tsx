import { useEffect, useState } from 'react'
import styles from './Loading.module.css'

/**
 * Loading state (handoff §5.7): skeleton bars in margin-tint plus "Loading {thing}…".
 * Shown only if loading takes longer than ~300ms, so fast loads never flash.
 */
export function Loading({ thing }: { thing: string }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const t = window.setTimeout(() => setVisible(true), 300) // display delay, not a user-facing timer
    return () => window.clearTimeout(t)
  }, [])
  return (
    <div className={styles.loading} aria-busy="true" data-visible={visible}>
      <div className={styles.bar} style={{ height: 36, width: '70%' }} />
      <div className={styles.bar} style={{ height: 16, width: '45%' }} />
      <div className={styles.bar} style={{ height: 14, width: '100%' }} />
      <div className={styles.bar} style={{ height: 14, width: '96%' }} />
      <div className={styles.bar} style={{ height: 14, width: '88%' }} />
      <p className="meta" role="status">
        {visible ? `Loading ${thing}…` : ''}
      </p>
    </div>
  )
}

/** Error state: says what happened and how to fix it, without apologising. */
export function LoadError({ what, onRetry }: { what: string; onRetry: () => void }) {
  return (
    <div className={styles.error} role="alert">
      <p className="meta">{what} did not load. Check your connection and try again.</p>
      <button type="button" className="btn btn-primary" onClick={onRetry}>
        Try again
      </button>
    </div>
  )
}
