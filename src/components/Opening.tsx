import { useEffect, useRef } from 'react'
import { APP_NAME } from '../config'
import { setSessionFlag } from '../lib/storage'
import styles from './Opening.module.css'

export const OPENING_FLAG = 'opening-seen'
/** When the welcome highlight sweep starts if the opening plays (ms). */
export const OPENING_SWEEP_DELAY = 1300

const EASE = 'cubic-bezier(0.25, 1, 0.5, 1)'

/**
 * Opening sequence (handoff §7): indigo panel, wordmark settles, turmeric underline draws,
 * panel lifts. An overlay only — the welcome page is already rendered underneath and the
 * router is never blocked. Any pointer or key press finishes it at once.
 */
export function Opening({ onDone }: { onDone: () => void }) {
  const panel = useRef<HTMLDivElement>(null)
  const word = useRef<HTMLSpanElement>(null)
  const line = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const p = panel.current
    const w = word.current
    const l = line.current
    if (!p || !w || !l || typeof p.animate !== 'function') {
      setSessionFlag(OPENING_FLAG)
      onDone()
      return
    }
    let finished = false
    const finish = () => {
      if (finished) return
      finished = true
      setSessionFlag(OPENING_FLAG)
      onDone()
    }

    const anims = [
      w.animate(
        [
          { opacity: 0, letterSpacing: '0.14em' },
          { opacity: 1, letterSpacing: '-0.01em' },
        ],
        { duration: 500, delay: 300, easing: EASE, fill: 'both' },
      ),
      l.animate([{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], { duration: 300, delay: 700, easing: EASE, fill: 'both' }),
      p.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-100%)' }], {
        duration: 300,
        delay: 1000,
        easing: EASE,
        fill: 'both',
      }),
    ]
    // The content becomes usable as soon as the lift starts (underline ends at 1000ms).
    anims[1].finished.then(
      () => (p.style.pointerEvents = 'none'),
      () => undefined,
    )
    anims[2].finished.then(finish, finish)
    const backup = window.setTimeout(finish, 1400) // backup removal in case `finished` never fires

    const skip = () => {
      anims.forEach((a) => {
        try {
          a.finish()
        } catch {
          // already finished
        }
      })
      finish()
    }
    window.addEventListener('pointerdown', skip, { once: true })
    window.addEventListener('keydown', skip, { once: true })
    return () => {
      window.clearTimeout(backup)
      window.removeEventListener('pointerdown', skip)
      window.removeEventListener('keydown', skip)
      anims.forEach((a) => a.cancel())
    }
  }, [onDone])

  return (
    <div ref={panel} className={styles.panel} aria-hidden="true">
      <span className={styles.mark}>
        <span ref={word} className={styles.word}>
          {APP_NAME}
        </span>
        <span ref={line} className={styles.line} />
      </span>
    </div>
  )
}
