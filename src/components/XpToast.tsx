import { useEffect, useState } from 'react'
import { useAppState } from '../state/useAppState'
import { Bolt } from './Icons'
import styles from './XpToast.module.css'

/** "+15 XP · Lesson read": brief, polite, never blocks anything. */
export function XpToast() {
  const { lastAward } = useAppState()
  const [hidden, setHidden] = useState<number | null>(null)

  useEffect(() => {
    if (!lastAward) return
    const at = lastAward.at
    const t = window.setTimeout(() => setHidden(at), 1800) // display time only
    return () => window.clearTimeout(t)
  }, [lastAward])

  const show = lastAward && hidden !== lastAward.at

  return (
    <div className={styles.wrap} role="status" aria-live="polite">
      {show && (
        <span key={lastAward.at} className={`${styles.toast} pop-in`}>
          <Bolt size={16} />+{lastAward.xp} XP<span className={styles.label}> · {lastAward.label}</span>
        </span>
      )}
    </div>
  )
}
