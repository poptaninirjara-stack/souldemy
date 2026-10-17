import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { Check, ChevronRight, Cross } from '../components/Icons'
import { Page } from '../components/Page'
import { findModule, modulePath } from '../lib/content'
import { bundle } from '../lib/games'
import { BOX_DAYS, review as nextCard, shuffle } from '../lib/gamify'
import { placeFor } from '../lib/places'
import { useAppState } from '../state/useAppState'
import { useProgress } from '../state/useProgress'
import type { Phrase } from '../types/game'
import game from './GamePage.module.css'
import styles from './ReviewPage.module.css'

const SESSION = 10

/** Warm-up review: collected phrases come back just before you would forget them (Leitner boxes). */
export function ReviewPage() {
  const { deck } = useAppState()
  const { dueCards, today } = useProgress()
  const [session, setSession] = useState<string[] | null>(null)
  const deckSize = Object.keys(deck).length
  const nextDue = Object.values(deck)
    .map((c) => c.due)
    .filter((d) => d > today)
    .sort()[0]

  if (session) return <ReviewSession ids={session} onDone={() => setSession(null)} />

  const placesWithPhrases = [...new Set(bundle.phrases.map((p) => p.moduleId))]

  return (
    <Page width="library">
      <header className={styles.head}>
        <h1>Review</h1>
        <p className="meta">Recall a phrase from what it is for. Right answers come back later; misses come back tomorrow.</p>
      </header>

      <section className={`card ${styles.hero}`} aria-live="polite">
        <p className={styles.big}>{dueCards.length}</p>
        <p className={styles.bigLabel}>{dueCards.length === 1 ? 'card ready' : 'cards ready'}</p>
        <p className={styles.sub}>
          {deckSize} collected
          {deckSize && !dueCards.length && nextDue ? ` · next one due ${nextDue === today ? 'today' : formatDue(nextDue, today)}` : ''}
        </p>
        {dueCards.length > 0 ? (
          <button type="button" className="btn btn-go btn-block" onClick={() => setSession(shuffle(dueCards).slice(0, SESSION))}>
            Start warm-up ({Math.min(SESSION, dueCards.length)} cards)
          </button>
        ) : deckSize ? (
          <p className={styles.done}>All caught up. Come back later and your cards will be waiting.</p>
        ) : (
          <p className={styles.done}>Your deck is empty. Collect phrase cards in any of these places:</p>
        )}
      </section>

      <section aria-labelledby="where-h" className={styles.where}>
        <h2 id="where-h" className={styles.h2}>
          Where phrases come from
        </h2>
        <ul className={styles.list}>
          {placesWithPhrases.map((id) => {
            const m = findModule(id)
            const pl = placeFor(id)
            const all = bundle.phrases.filter((p) => p.moduleId === id)
            const have = all.filter((p) => deck[p.id]).length
            if (!m || !pl) return null
            return (
              <li key={id}>
                <Link to={modulePath(m)} className={styles.row}>
                  <span>
                    <span className={styles.rowName}>{pl.name}</span>
                    <span className={styles.rowMeta}>{id === 'r1' ? 'Task words' : '"Useful language" phrases'}</span>
                  </span>
                  <span className={styles.count}>
                    {have}/{all.length}
                  </span>
                  <ChevronRight />
                </Link>
              </li>
            )
          })}
        </ul>
      </section>
    </Page>
  )
}

function formatDue(due: string, today: string): string {
  const days = Math.round((Date.parse(due) - Date.parse(today)) / 86_400_000)
  return days === 1 ? 'tomorrow' : `in ${days} days`
}

function questionFor(p: Phrase): string {
  return p.kind === 'taskword' ? 'Which task word asks you to do this?' : 'Which phrase is for this?'
}

function ReviewSession({ ids, onDone }: { ids: string[]; onDone: () => void }) {
  const { deck, reviewPhrase } = useAppState()
  const { today } = useProgress()
  const cards = useMemo(() => ids.map((id) => bundle.phrases.find((p) => p.id === id)).filter((p): p is Phrase => !!p), [ids])
  const [i, setI] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const [right, setRight] = useState(0)
  const [afterBox, setAfterBox] = useState<number | null>(null)

  const card = cards[i]
  const options = useMemo(() => {
    if (!card) return []
    const pool = bundle.phrases.filter((p) => p.kind === card.kind && p.prompt !== card.prompt && p.answer !== card.answer)
    const wrong = shuffle([...new Set(pool.map((p) => p.answer))]).slice(0, card.kind === 'taskword' ? 3 : 2)
    return shuffle([card.answer, ...wrong])
  }, [card])

  if (!card) {
    return (
      <Page width="library">
        <div className={`card ${styles.hero}`}>
          <h1 className={styles.endTitle}>Warm-up done</h1>
          <p className={styles.big}>
            {right}/{cards.length}
          </p>
          <p className={styles.bigLabel}>recalled</p>
          <button type="button" className="btn btn-go btn-block" onClick={onDone}>
            Back to Review
          </button>
          <Link to="/" className="btn btn-secondary btn-block">
            Back to campus
          </Link>
        </div>
      </Page>
    )
  }

  const correctIndex = options.indexOf(card.answer)
  const choose = (k: number) => {
    if (picked !== null) return
    const ok = k === correctIndex
    setPicked(k)
    if (ok) setRight((n) => n + 1)
    const current = deck[card.id]
    setAfterBox(current ? nextCard(current, ok, today).box : null)
    reviewPhrase(card.id, ok)
  }

  return (
    <div className={game.screen}>
      <div className={game.top}>
        <button type="button" className={game.quit} onClick={onDone} aria-label="Stop the warm-up">
          <Cross size={20} />
        </button>
        <div className={game.titleWrap}>
          <p className={game.where}>Review</p>
          <h1 className={game.title}>Warm-up</h1>
        </div>
      </div>
      <div className={game.body}>
        <div className={game.steps}>
          <ol className={game.stepDots} aria-hidden="true">
            {cards.map((c, k) => (
              <li key={c.id} data-state={k < i ? 'right' : k === i ? 'now' : 'todo'} />
            ))}
          </ol>
          <p className={game.stepText}>
            {i + 1} of {cards.length}
          </p>
        </div>
        <div className={`${game.card} pop-in`} key={card.id}>
          <p className={game.ask}>
            {questionFor(card)} · {placeFor(card.moduleId)?.name}
          </p>
          <p className={game.cardText}>{card.prompt}</p>
        </div>
        <div className={game.options} role="group" aria-label="Answers">
          {options.map((o, k) => (
            <button
              key={o}
              type="button"
              className={game.option}
              data-state={picked !== null ? (k === correctIndex ? 'right' : k === picked ? 'wrong' : 'off') : undefined}
              aria-disabled={picked !== null || undefined}
              onClick={() => choose(k)}
            >
              <span className={game.letter} aria-hidden="true">
                {String.fromCharCode(65 + k)}
              </span>
              <span>{o}</span>
            </button>
          ))}
        </div>
        <div role="status" aria-live="polite">
          {picked !== null && (
            <div className={`${game.feedback} pop-in`} data-tone={picked === correctIndex ? 'right' : 'wrong'}>
              <p className={game.fbHead}>
                {picked === correctIndex ? <Check size={20} /> : <Cross size={20} />}
                <strong>{picked === correctIndex ? 'Recalled.' : 'Not this time.'}</strong>
              </p>
              <p className={game.why}>
                "{card.answer}" is for: {card.prompt}.{' '}
                {afterBox !== null
                  ? picked === correctIndex
                    ? `It comes back in ${BOX_DAYS[afterBox]} ${BOX_DAYS[afterBox] === 1 ? 'day' : 'days'}.`
                    : 'It comes back tomorrow.'
                  : ''}
              </p>
              <button
                type="button"
                className="btn btn-primary btn-block"
                autoFocus
                onClick={() => {
                  setI(i + 1)
                  setPicked(null)
                }}
              >
                {i + 1 >= cards.length ? 'Finish' : 'Next'} <ChevronRight />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
