import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router'
import { Check, ChevronRight, Cross } from '../components/Icons'
import { PlaceIcon } from '../components/PlaceIcon'
import { findModule, modulePath } from '../lib/content'
import { getGame, gamesFor, ROUND_SIZE } from '../lib/games'
import { shuffle, XP } from '../lib/gamify'
import { placeFor } from '../lib/places'
import { useAppState } from '../state/useAppState'
import type { Game, PickGame, ScenarioGame, SortGame } from '../types/game'
import styles from './GamePage.module.css'
import { NotFound } from './NotFound'

/** A light tap on Android when an answer is right (ignored elsewhere and under reduced motion). */
function buzz() {
  try {
    if (document.documentElement.dataset.motion !== 'reduced') navigator.vibrate?.(15)
  } catch {
    // not supported
  }
}

export function GamePage() {
  const { gameId } = useParams()
  const game = getGame(gameId)
  const [round, setRound] = useState(0)
  if (!game) return <NotFound />
  return <GameRound key={`${game.id}-${round}`} game={game} onAgain={() => setRound((r) => r + 1)} />
}

function GameRound({ game, onAgain }: { game: Game; onAgain: () => void }) {
  const mod = findModule(game.moduleId)!
  const place = placeFor(game.moduleId)
  const [result, setResult] = useState<{ score: number; total: number } | null>(null)

  return (
    <div className={styles.screen}>
      <div className={styles.top}>
        <Link to={modulePath(mod)} className={styles.quit} aria-label={`Leave the game and go back to ${place?.name ?? mod.title}`}>
          <Cross size={20} />
        </Link>
        <div className={styles.titleWrap}>
          <p className={styles.where}>{place?.name}</p>
          <h1 className={styles.title}>{game.title}</h1>
        </div>
      </div>
      {result ? (
        <Summary game={game} score={result.score} total={result.total} onAgain={onAgain} />
      ) : game.kind === 'sort' ? (
        <SortEngine game={game} onDone={(score, total) => setResult({ score, total })} />
      ) : game.kind === 'pick' ? (
        <PickEngine game={game} onDone={(score, total) => setResult({ score, total })} />
      ) : (
        <ScenarioEngine game={game} onDone={(score, total) => setResult({ score, total })} />
      )}
    </div>
  )
}

function Steps({ index, total, outcomes }: { index: number; total: number; outcomes: (boolean | undefined)[] }) {
  return (
    <div className={styles.steps}>
      <ol className={styles.stepDots} aria-hidden="true">
        {Array.from({ length: total }, (_, i) => (
          <li key={i} data-state={outcomes[i] === true ? 'right' : outcomes[i] === false ? 'wrong' : i === index ? 'now' : 'todo'} />
        ))}
      </ol>
      <p className={styles.stepText}>
        {Math.min(index + 1, total)} of {total}
      </p>
    </div>
  )
}

function Feedback({ right, why, reply, onNext, nextLabel }: { right: boolean; why: string; reply?: string; onNext?: () => void; nextLabel?: string }) {
  const nextRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    nextRef.current?.focus()
  }, [])
  return (
    <div className={`${styles.feedback} pop-in`} data-tone={right ? 'right' : 'wrong'}>
      <p className={styles.fbHead}>
        {right ? <Check size={20} /> : <Cross size={20} />}
        <strong>{right ? 'Nice. That works.' : 'Not quite.'}</strong>
      </p>
      {reply && <p className={styles.reply}>{reply}</p>}
      <p className={styles.why}>{why}</p>
      {onNext && (
        <button ref={nextRef} type="button" className="btn btn-primary btn-block" onClick={onNext}>
          {nextLabel ?? 'Next'} <ChevronRight />
        </button>
      )}
    </div>
  )
}

// ---------- Sort ----------

function SortEngine({ game, onDone }: { game: SortGame; onDone: (score: number, total: number) => void }) {
  const items = useMemo(() => shuffle(game.items).slice(0, ROUND_SIZE), [game])
  const [i, setI] = useState(0)
  const [picked, setPicked] = useState<string | null>(null)
  const [outcomes, setOutcomes] = useState<boolean[]>([])
  const item = items[i]

  const choose = (bin: string) => {
    if (picked) return
    const right = bin === item.bin
    if (right) buzz()
    setPicked(bin)
    setOutcomes((o) => [...o, right])
  }
  const next = () => {
    if (i + 1 >= items.length) onDone(outcomes.filter(Boolean).length, items.length)
    else {
      setI(i + 1)
      setPicked(null)
    }
  }
  const binLabel = (id: string) => game.bins.find((b) => b.id === id)?.label ?? id

  return (
    <div className={styles.body}>
      {i === 0 && !picked && <p className={styles.intro}>{game.intro}</p>}
      <Steps index={i} total={items.length} outcomes={outcomes} />
      <div className={`${styles.card} pop-in`} key={i}>
        <p className={styles.cardText}>{item.text}</p>
      </div>
      <div className={styles.bins} role="group" aria-label="Choose where it belongs">
        {game.bins.map((b) => (
          <button
            key={b.id}
            type="button"
            className={styles.bin}
            data-state={picked ? (b.id === item.bin ? 'right' : b.id === picked ? 'wrong' : 'off') : undefined}
            aria-disabled={!!picked || undefined}
            onClick={() => choose(b.id)}
          >
            {b.label}
          </button>
        ))}
      </div>
      <div role="status" aria-live="polite">
        {picked && (
          <Feedback
            right={picked === item.bin}
            why={picked === item.bin ? item.why : `It's ${binLabel(item.bin)}. ${item.why}`}
            onNext={next}
            nextLabel={i + 1 >= items.length ? 'See results' : 'Next'}
          />
        )}
      </div>
    </div>
  )
}

// ---------- Pick ----------

function PickEngine({ game, onDone }: { game: PickGame; onDone: (score: number, total: number) => void }) {
  const items = useMemo(() => shuffle(game.items).slice(0, ROUND_SIZE), [game])
  const [i, setI] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const [outcomes, setOutcomes] = useState<boolean[]>([])
  const item = items[i]

  const choose = (k: number) => {
    if (picked !== null) return
    const right = k === item.correct
    if (right) buzz()
    setPicked(k)
    setOutcomes((o) => [...o, right])
  }
  const next = () => {
    if (i + 1 >= items.length) onDone(outcomes.filter(Boolean).length, items.length)
    else {
      setI(i + 1)
      setPicked(null)
    }
  }

  return (
    <div className={styles.body}>
      {i === 0 && picked === null && <p className={styles.intro}>{game.intro}</p>}
      <Steps index={i} total={items.length} outcomes={outcomes} />
      <div className={`${styles.card} pop-in`} key={i}>
        <p className={styles.ask}>{game.ask}</p>
        <p className={styles.cardText}>{item.prompt}</p>
      </div>
      <div className={styles.options} role="group" aria-label="Answers">
        {item.options.map((o, k) => (
          <button
            key={k}
            type="button"
            className={styles.option}
            data-state={picked !== null ? (k === item.correct ? 'right' : k === picked ? 'wrong' : 'off') : undefined}
            aria-disabled={picked !== null || undefined}
            onClick={() => choose(k)}
          >
            <span className={styles.letter} aria-hidden="true">
              {String.fromCharCode(65 + k)}
            </span>
            <span>{o}</span>
          </button>
        ))}
      </div>
      <div role="status" aria-live="polite">
        {picked !== null && (
          <Feedback
            right={picked === item.correct}
            why={picked === item.correct ? item.why : `The answer is ${String.fromCharCode(65 + item.correct)}. ${item.why}`}
            onNext={next}
            nextLabel={i + 1 >= items.length ? 'See results' : 'Next'}
          />
        )}
      </div>
    </div>
  )
}

// ---------- Scenario ----------

function ScenarioEngine({ game, onDone }: { game: ScenarioGame; onDone: (score: number, total: number) => void }) {
  const [i, setI] = useState(0)
  const [tried, setTried] = useState<number[]>([])
  const [outcomes, setOutcomes] = useState<boolean[]>([])
  const [chat, setChat] = useState<{ who: string; text: string; me?: boolean }[]>([])
  const step = game.steps[i]
  const last = tried.length ? step.choices[tried[tried.length - 1]] : undefined
  const solved = last?.good ?? false

  const choose = (k: number) => {
    if (solved || tried.includes(k)) return
    const c = step.choices[k]
    if (tried.length === 0) setOutcomes((o) => [...o, c.good])
    if (c.good) buzz()
    setTried((t) => [...t, k])
  }
  const next = () => {
    const good = step.choices.find((c) => c.good)!
    const log = [...chat, { who: step.from, text: step.message }, { who: 'You', text: good.text, me: true }]
    if (i + 1 >= game.steps.length) onDone(outcomes.filter(Boolean).length, game.steps.length)
    else {
      setChat(log)
      setI(i + 1)
      setTried([])
    }
  }

  return (
    <div className={styles.body}>
      {i === 0 && tried.length === 0 && <p className={styles.intro}>{game.intro}</p>}
      <Steps index={i} total={game.steps.length} outcomes={outcomes} />
      {chat.length > 0 && (
        <details className={styles.history}>
          <summary>So far ({chat.filter((c) => c.me).length} {chat.filter((c) => c.me).length === 1 ? 'reply' : 'replies'})</summary>
          <ul>
            {chat.map((c, k) => (
              <li key={k} data-me={c.me}>
                <span className={styles.who}>{c.who}</span> {c.text}
              </li>
            ))}
          </ul>
        </details>
      )}
      <div className={`${styles.bubble} pop-in`} key={i}>
        <span className={styles.who}>
          {game.setting} · {step.from}
        </span>
        <p className={styles.cardText}>{step.message}</p>
      </div>
      <p className={styles.ask}>{step.ask}</p>
      <div className={styles.options} role="group" aria-label={step.ask}>
        {step.choices.map((c, k) => {
          const state = tried.includes(k) ? (c.good ? 'right' : 'wrong') : solved ? 'off' : undefined
          return (
            <button
              key={k}
              type="button"
              className={styles.option}
              data-state={state}
              aria-disabled={solved || tried.includes(k) || undefined}
              onClick={() => choose(k)}
            >
              <span className={styles.letter} aria-hidden="true">
                {String.fromCharCode(65 + k)}
              </span>
              <span>{c.text}</span>
            </button>
          )
        })}
      </div>
      <div role="status" aria-live="polite">
        {last && (
          <Feedback
            right={last.good}
            reply={last.reply}
            why={last.good ? last.why : `${last.why} Try another answer.`}
            onNext={solved ? next : undefined}
            nextLabel={i + 1 >= game.steps.length ? 'Finish' : 'Next'}
          />
        )}
      </div>
    </div>
  )
}

// ---------- Summary ----------

function Summary({ game, score, total, onAgain }: { game: Game; score: number; total: number; onAgain: () => void }) {
  const { recordGame } = useAppState()
  const mod = findModule(game.moduleId)!
  const [newBest, setNewBest] = useState(false)
  const recorded = useRef(false)
  useEffect(() => {
    if (recorded.current) return
    recorded.current = true
    setNewBest(recordGame(game.id, score, total))
  }, [game.id, score, total, recordGame])

  const perfect = score === total
  const others = gamesFor(game.moduleId).filter((g) => g.id !== game.id)
  const next = others[0]
  const headline = perfect ? 'Perfect round!' : score >= total * 0.7 ? 'Strong round.' : score >= total * 0.4 ? 'Good practice.' : 'Every miss teaches something.'
  const line = game.kind === 'scenario' ? `${score} of ${total} right first time.` : `${score} of ${total} correct.`

  return (
    <div className={styles.body}>
      <div className={`${styles.summary} pop-in`} data-perfect={perfect}>
        <span className={styles.summaryIcon} aria-hidden="true">
          <PlaceIcon moduleId={game.moduleId} size={64} />
        </span>
        <h2 className={styles.summaryTitle}>{headline}</h2>
        <p className={styles.score}>{line}</p>
        {newBest && <p className={styles.summaryXp}>New personal best</p>}
        <p className={styles.source}>From: {game.source}</p>
      </div>
      <div className={styles.summaryActions}>
        <button type="button" className="btn btn-go btn-block" onClick={onAgain}>
          Play again
        </button>
        {next && (
          <Link to={`/play/${next.id}`} className="btn btn-secondary btn-block">
            Next game: {next.title}
          </Link>
        )}
        <Link to={modulePath(mod)} className="btn btn-secondary btn-block">
          Back to {placeFor(game.moduleId)?.name ?? mod.title}
        </Link>
      </div>
      <p className="caption">
        Each game earns {XP.gameDone} XP once a day, plus a one-time {XP.gamePerfect} XP bonus for your first perfect round.
      </p>
    </div>
  )
}
