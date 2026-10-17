import { useEffect, useRef } from 'react'
import { APP_NAME } from '../config'
import type { Badge } from '../lib/gamify'
import { useAppState } from '../state/useAppState'
import { useProgress } from '../state/useProgress'
import styles from './Celebration.module.css'

const CONFETTI = Array.from({ length: 18 }, (_, i) => i)

/**
 * Celebrates a new rank or badge, one at a time. Rare by design: only milestones get confetti,
 * and the message always says what the student can now do.
 */
export function Celebration() {
  const { seen, markSeen } = useAppState()
  const { badges, rank } = useProgress()
  const ref = useRef<HTMLDialogElement>(null)
  const returnTo = useRef<Element | null>(null)

  const newBadge: Badge | undefined = badges.find((b) => !seen.badges.includes(b.id))
  const rankUp = rank.level > seen.level
  const open = rankUp || !!newBadge

  const title = rankUp ? `You are now a ${rank.name}` : newBadge?.title ?? ''
  const can = rankUp ? rank.can : newBadge?.can ?? ''
  const icon = rankUp ? '🎓' : newBadge?.icon ?? ''
  const kicker = rankUp ? `Rank ${rank.level}` : 'New badge'

  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) {
      returnTo.current = document.activeElement
      if (typeof d.showModal === 'function') d.showModal()
      else d.setAttribute('open', '')
    } else if (!open && d.open) {
      if (typeof d.close === 'function') d.close()
      else d.removeAttribute('open')
      if (returnTo.current instanceof HTMLElement) returnTo.current.focus()
    }
  }, [open, title])

  const dismiss = () => {
    if (rankUp) markSeen([], rank.level)
    else if (newBadge) markSeen([newBadge.id], seen.level)
  }

  const share = `I just earned "${title}" on ${APP_NAME}: ${can}`

  return (
    <dialog
      ref={ref}
      className={styles.dialog}
      aria-labelledby="celebrate-title"
      onCancel={(e) => {
        e.preventDefault()
        dismiss()
      }}
    >
      {open && (
        <div className={styles.inner}>
          <div className={styles.confetti} aria-hidden="true">
            {CONFETTI.map((i) => (
              <span key={i} style={{ '--i': i } as React.CSSProperties} />
            ))}
          </div>
          <div className={`${styles.medal} pop-in`} aria-hidden="true">
            {icon}
          </div>
          <p className={styles.kicker}>{kicker}</p>
          <h2 id="celebrate-title" className={styles.title}>
            {title}
          </h2>
          <p className={styles.can}>{can}</p>
          <div className={styles.actions}>
            <button type="button" className="btn btn-go btn-block" onClick={dismiss} autoFocus>
              Keep going
            </button>
            <a
              className="btn btn-secondary btn-block"
              href={`https://wa.me/?text=${encodeURIComponent(share)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Share on WhatsApp<span className="visually-hidden"> (opens in a new tab)</span>
            </a>
          </div>
        </div>
      )}
    </dialog>
  )
}
