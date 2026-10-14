import { useId } from 'react'
import { useAppState } from '../state/useAppState'
import { Html } from './Html'
import styles from './Exercise.module.css'

/** Open practice (no model answer in the content): the task plus an optional notes box. No scoring. */
export function Practice({ id, title, html }: { id: string; title: string; html: string }) {
  const { attempts, setAttemptText } = useAppState()
  const uid = useId()
  return (
    <section className={styles.exercise} aria-labelledby={`${uid}-h`}>
      <h2 id={`${uid}-h`} className={styles.title}>
        {title}
      </h2>
      <Html className="prose" html={html} />
      <div className={styles.attempt}>
        <label htmlFor={`${uid}-a`} className={styles.attemptLabel}>
          Your notes
        </label>
        <textarea
          id={`${uid}-a`}
          className={styles.textarea}
          rows={6}
          value={attempts[id]?.text ?? ''}
          onChange={(e) => setAttemptText(id, e.target.value)}
          spellCheck
        />
        <p className="caption">Optional. Saved on this device only.</p>
      </div>
    </section>
  )
}
