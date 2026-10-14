import { useEffect, useId, useRef } from 'react'
import { useAppState } from '../state/useAppState'
import { Html } from './Html'
import styles from './Exercise.module.css'

interface Props {
  id: string
  title: string
  promptHtml: string
  answerHtml: string
  labelsHtml: string[]
}

/**
 * Worksheet exercise. The model answer stays hidden until the student has written
 * an attempt; the reveal control is disabled (but focusable, with a reason) until then.
 */
export function Exercise({ id, title, promptHtml, answerHtml, labelsHtml }: Props) {
  const { attempts, setAttemptText, revealAnswer } = useAppState()
  const attempt = attempts[id]
  const text = attempt?.text ?? ''
  const revealed = !!attempt?.revealed
  const canReveal = text.trim().length > 0
  const uid = useId()
  const answerRef = useRef<HTMLDivElement>(null)
  const focusAnswer = useRef(false)

  // The reveal button disappears, so move focus to the answer that replaced it.
  useEffect(() => {
    if (revealed && focusAnswer.current) {
      focusAnswer.current = false
      answerRef.current?.focus()
    }
  }, [revealed])

  const onReveal = () => {
    if (!canReveal) return
    focusAnswer.current = true
    revealAnswer(id)
  }

  return (
    <section className={styles.exercise} aria-labelledby={`${uid}-h`}>
      <h2 id={`${uid}-h`} className={styles.title}>
        {title}
      </h2>
      {labelsHtml.map((l) => (
        <Html key={l} as="p" className={styles.label} html={l} />
      ))}
      <Html className="prose" html={promptHtml} />

      <div className={styles.attempt}>
        <label htmlFor={`${uid}-a`} className={styles.attemptLabel}>
          Your answer
        </label>
        <textarea
          id={`${uid}-a`}
          className={styles.textarea}
          rows={4}
          value={text}
          onChange={(e) => setAttemptText(id, e.target.value)}
          spellCheck
        />
        <p className="caption" id={`${uid}-hint`}>
          Saved on this device only.
        </p>
      </div>

      {!revealed && (
        <div className={styles.actions}>
          <button
            type="button"
            className="btn btn-secondary"
            aria-disabled={!canReveal}
            aria-describedby={canReveal ? undefined : `${uid}-why`}
            onClick={onReveal}
          >
            Show model answer
          </button>
          {!canReveal && (
            <p className="caption" id={`${uid}-why`}>
              Write your attempt first. The model answer appears after you try.
            </p>
          )}
        </div>
      )}

      {revealed && (
        <div ref={answerRef} tabIndex={-1} className={`${styles.answer} margin-arrive`} role="region" aria-label={`Model answer for ${title}`}>
          <Html className={`prose ${styles.answerText}`} html={answerHtml} />
        </div>
      )}
    </section>
  )
}
