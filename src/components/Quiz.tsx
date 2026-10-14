import { useId, useRef, type KeyboardEvent } from 'react'
import { useAppState, type QuizAnswer } from '../state/useAppState'
import type { QuizItem } from '../types/content'
import { Html } from './Html'
import { Check, Cross, Info } from './Icons'
import styles from './Quiz.module.css'

const LETTERS = 'ABCDEFGH'
const IDLE: QuizAnswer = { selected: null, status: 'idle' }

/** Self-correcting quiz (Research-Oriented track only). No timers, no points, nothing shared. */
export function Quiz({ title, items }: { title: string; items: QuizItem[] }) {
  const { quiz } = useAppState()
  const uid = useId()
  const correct = items.filter((i) => quiz[i.id]?.status === 'correct').length
  const answered = items.filter((i) => {
    const s = quiz[i.id]?.status
    return s === 'correct' || s === 'shown'
  }).length

  return (
    <section className={styles.quiz} aria-labelledby={`${uid}-h`}>
      <h2 id={`${uid}-h`} className={styles.title}>
        {title}
      </h2>
      <p className="meta">Choose an answer, then check it. You can try again as often as you like.</p>
      <ol className={styles.items}>
        {items.map((item, i) => (
          <QuizQuestion key={item.id} item={item} number={i + 1} />
        ))}
      </ol>
      <p className={styles.summary} aria-live="polite">
        {answered === items.length
          ? `${correct} of ${items.length} correct.`
          : `${correct} of ${items.length} correct so far.`}
      </p>
    </section>
  )
}

export function QuizQuestion({ item, number }: { item: QuizItem; number: number }) {
  const { quiz, setQuizAnswer } = useAppState()
  const state = quiz[item.id] ?? IDLE
  const { selected, status } = state
  const locked = status === 'correct' || status === 'shown'
  const uid = useId()
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([])

  const select = (i: number) => {
    if (locked || status === 'incorrect') return
    setQuizAnswer(item.id, { selected: i, status: 'idle' })
  }

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    const n = item.optionsHtml.length
    let next = -1
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') next = (i + 1) % n
    else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') next = (i - 1 + n) % n
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = n - 1
    if (next < 0) return
    e.preventDefault()
    optionRefs.current[next]?.focus()
    select(next)
  }

  // The options stay in place, so focus can return to them when the action buttons change.
  const check = () => {
    if (selected === null) return
    const right = selected === item.correctIndex
    setQuizAnswer(item.id, { selected, status: right ? 'correct' : 'incorrect' })
    if (right) optionRefs.current[selected]?.focus()
  }
  const retry = () => {
    setQuizAnswer(item.id, IDLE)
    optionRefs.current[0]?.focus()
  }
  const show = () => {
    setQuizAnswer(item.id, { selected, status: 'shown' })
    optionRefs.current[item.correctIndex]?.focus()
  }

  const focusable = selected ?? 0

  return (
    <li className={styles.item}>
      <p id={`${uid}-q`} className={styles.question}>
        <span className={styles.qnum}>{number}.</span> <Html as="span" html={item.questionHtml} />
      </p>
      <div role="radiogroup" aria-labelledby={`${uid}-q`} className={styles.options}>
        {item.optionsHtml.map((opt, i) => {
          const isSelected = selected === i
          const showCorrect = (status === 'correct' && isSelected) || (status === 'shown' && i === item.correctIndex)
          const showWrong = status === 'incorrect' && isSelected
          const view = showCorrect ? 'correct' : showWrong ? 'incorrect' : isSelected ? 'selected' : 'idle'
          return (
            <button
              key={i}
              ref={(el) => {
                optionRefs.current[i] = el
              }}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-disabled={locked || status === 'incorrect' || undefined}
              tabIndex={i === focusable ? 0 : -1}
              className={styles.option}
              data-view={view}
              data-locked={locked || status === 'incorrect'}
              onClick={() => select(i)}
              onKeyDown={(e) => onKeyDown(e, i)}
            >
              <span className={styles.radio} aria-hidden="true" />
              <span className={styles.letter} aria-hidden="true">
                {LETTERS[i]}
              </span>
              <span className={styles.optText}>
                <Html as="span" html={opt} />
                {showCorrect && (
                  <span className={styles.tag} data-tone="correct">
                    <Check size={16} /> Correct answer
                  </span>
                )}
                {showWrong && (
                  <span className={styles.tag} data-tone="incorrect">
                    <Cross size={16} /> Your answer
                  </span>
                )}
              </span>
            </button>
          )
        })}
      </div>

      <div className={styles.feedback} role="status" aria-live="polite">
        {status === 'correct' && (
          <div className={styles.panel} data-tone="correct">
            <p className={styles.fbHead}>
              <Check size={20} /> <strong>Correct.</strong>
            </p>
            {item.explanationHtml && <Html as="p" className={styles.fbText} html={item.explanationHtml} />}
          </div>
        )}
        {status === 'incorrect' && (
          <div className={styles.panel} data-tone="incorrect">
            <p className={styles.fbHead}>
              <Cross size={20} /> <strong>Incorrect.</strong>
            </p>
            <p className={styles.fbText}>That is not the best answer. Try again, or show the answer.</p>
          </div>
        )}
        {status === 'shown' && (
          <div className={styles.panel} data-tone="shown">
            <p className={styles.fbHead}>
              <Info size={20} /> <strong>Answer shown.</strong>
            </p>
            <p className={styles.fbText}>
              The answer is {LETTERS[item.correctIndex]}.{' '}
              {item.explanationHtml && <Html as="span" html={item.explanationHtml} />}
            </p>
          </div>
        )}
      </div>

      {!locked && (
        <div className={styles.actions}>
          {status === 'idle' && (
            <button type="button" className="btn btn-primary" aria-disabled={selected === null} onClick={check}>
              Check answer
            </button>
          )}
          {status === 'incorrect' && (
            <>
              <button type="button" className="btn btn-primary" onClick={retry}>
                Try again
              </button>
              <button type="button" className="btn btn-secondary" onClick={show}>
                Show answer
              </button>
            </>
          )}
        </div>
      )}
    </li>
  )
}
