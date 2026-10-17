// App-wide state, stored on the device (see lib/storage.ts) and, when signed in, synced to
// the account by lib/sync.ts. The provider is remounted when a sync replaces device data.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { isTrackId, pageKey } from '../lib/content'
import { newCard, review, XP, xpKey, type Deck, type GameRecords, type XpLog } from '../lib/gamify'
import { clearAll, load, migrate, remove, save } from '../lib/storage'
import { deleteAccountProgress, isSyncing } from '../lib/sync'
import { todayISO } from '../lib/weekly'
import type { TrackId } from '../types/content'

export interface LastLocation {
  trackId: TrackId
  moduleId: string
  pageId: string
}

export interface Attempt {
  text: string
  revealed: boolean
}

export type QuizStatus = 'idle' | 'correct' | 'incorrect' | 'shown'
export interface QuizAnswer {
  selected: number | null
  status: QuizStatus
}

export type MotionPref = 'system' | 'reduce'

export interface Seen {
  badges: string[]
  level: number
}

/** The most recent XP award, for the "+15 XP" toast (not stored). */
export interface Award {
  xp: number
  label: string
  at: number
}

const isObject = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v)
const isStringArray = (v: unknown) => Array.isArray(v) && v.every((x) => typeof x === 'string')
const isLastLocation = (v: unknown) =>
  isObject(v) && isTrackId(v.trackId) && typeof v.moduleId === 'string' && typeof v.pageId === 'string'
const isSeen = (v: unknown) => isObject(v) && isStringArray(v.badges) && typeof v.level === 'number'

/** Like useState, but read from and written to storage under `key`. */
function usePersistent<T>(key: string, fallback: T, isValid?: (v: unknown) => boolean) {
  const [value, setValue] = useState<T>(() => load(key, fallback, isValid))
  const set = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const v = typeof next === 'function' ? (next as (p: T) => T)(prev) : next
        save(key, v)
        return v
      })
    },
    [key],
  )
  return [value, set] as const
}

export function useAppStateValue() {
  useState(() => {
    migrate()
    return null
  })

  const [visited, setVisited] = usePersistent<string[]>('visited', [], isStringArray)
  const [lastLocation, setLastLocation] = usePersistent<LastLocation | null>('lastLocation', null, (v) => v === null || isLastLocation(v))
  const [attempts, setAttempts] = usePersistent<Record<string, Attempt>>('attempts', {}, isObject)
  const [quiz, setQuiz] = usePersistent<Record<string, QuizAnswer>>('quiz', {}, isObject)
  const [xpLog, setXpLog] = usePersistent<XpLog>('xp', {}, isObject)
  const [deck, setDeck] = usePersistent<Deck>('deck', {}, isObject)
  const [records, setRecords] = usePersistent<GameRecords>('games', {}, isObject)
  const [weekGoal, setWeekGoal] = usePersistent<number>('goal', 4, (v) => v === 3 || v === 4 || v === 5)
  const [seen, setSeen] = usePersistent<Seen>('seen', { badges: [], level: 1 }, isSeen)
  const [motion, setMotion] = usePersistent<MotionPref>('ui', 'system', (v) => v === 'system' || v === 'reduce')
  const [lastAward, setLastAward] = useState<Award | null>(null)

  // A synchronous mirror of the XP log, so an event key is never awarded twice.
  const xpRef = useRef(xpLog)
  const recordsRef = useRef(records)
  useEffect(() => {
    xpRef.current = xpLog
    recordsRef.current = records
  }, [xpLog, records])

  const award = useCallback(
    (key: string, xp: number, label: string) => {
      if (xpRef.current[key]) return false
      const next = { ...xpRef.current, [key]: { xp, date: todayISO() } }
      xpRef.current = next
      setXpLog(next)
      setLastAward({ xp, label, at: Date.now() })
      return true
    },
    [setXpLog],
  )

  const visitedSet = useMemo(() => new Set(visited), [visited])

  const markVisited = useCallback(
    (moduleId: string, pageId: string) => {
      const k = pageKey(moduleId, pageId)
      setVisited((prev) => (prev.includes(k) ? prev : [...prev, k]))
      const lesson = moduleId.startsWith('r')
      award(xpKey.read(moduleId, pageId), lesson ? XP.lessonRead : XP.sectionRead, lesson ? 'Lesson read' : 'Section read')
    },
    [setVisited, award],
  )

  const setAttemptText = useCallback(
    (id: string, text: string) => setAttempts((prev) => ({ ...prev, [id]: { text, revealed: prev[id]?.revealed ?? false } })),
    [setAttempts],
  )
  const revealAnswer = useCallback(
    (id: string) => {
      setAttempts((prev) => ({ ...prev, [id]: { text: prev[id]?.text ?? '', revealed: true } }))
      award(xpKey.exercise(id), XP.exerciseTried, 'Exercise attempted')
    },
    [setAttempts, award],
  )
  const setQuizAnswer = useCallback(
    (id: string, answer: QuizAnswer) => {
      setQuiz((prev) => ({ ...prev, [id]: answer }))
      if (answer.status === 'correct') award(xpKey.quiz(id), XP.quizCorrect, 'Correct')
    },
    [setQuiz, award],
  )

  /** Record a finished game round. Returns whether it was a new personal best. */
  const recordGame = useCallback(
    (gameId: string, score: number, total: number) => {
      const r = recordsRef.current[gameId]
      const newBest = !r || score > r.best
      const next = { ...recordsRef.current, [gameId]: { best: Math.max(score, r?.best ?? 0), total, plays: (r?.plays ?? 0) + 1 } }
      recordsRef.current = next
      setRecords(next)
      award(xpKey.game(gameId, todayISO()), XP.gameDone, 'Practice round')
      if (score === total) award(xpKey.perfect(gameId), XP.gamePerfect, 'Perfect round')
      return newBest
    },
    [setRecords, award],
  )

  const collectPhrases = useCallback(
    (ids: string[]) => {
      const today = todayISO()
      setDeck((prev) => {
        const next = { ...prev }
        for (const id of ids) if (!next[id]) next[id] = newCard(today)
        return next
      })
      for (const id of ids) award(xpKey.collect(id), XP.phraseCollected, 'Phrase collected')
    },
    [setDeck, award],
  )

  const reviewPhrase = useCallback(
    (id: string, correct: boolean) => {
      const today = todayISO()
      setDeck((prev) => (prev[id] ? { ...prev, [id]: review(prev[id], correct, today) } : prev))
      if (correct) award(xpKey.review(id, today), XP.reviewCorrect, 'Recalled')
    },
    [setDeck, award],
  )

  const mirrorDone = useCallback(
    (moduleId: string) => award(xpKey.mirror(moduleId, todayISO()), XP.mirrorDone, 'Rehearsed aloud'),
    [award],
  )

  const markSeen = useCallback(
    (badgeIds: string[], level: number) =>
      setSeen((prev) => ({ badges: [...new Set([...prev.badges, ...badgeIds])], level: Math.max(prev.level, level) })),
    [setSeen],
  )

  const clearNotes = useCallback(() => {
    remove('attempts')
    remove('quiz')
    setAttempts({})
    setQuiz({})
  }, [setAttempts, setQuiz])

  /** Wipe everything this app stored (and the account copy, when signed in) and start again from the home page. */
  const resetAll = useCallback(async () => {
    if (isSyncing()) await deleteAccountProgress()
    clearAll()
    window.location.hash = '#/'
    window.location.reload()
  }, [])

  return {
    visited: visitedSet,
    markVisited,
    lastLocation,
    setLastLocation,
    attempts,
    setAttemptText,
    revealAnswer,
    quiz,
    setQuizAnswer,
    xpLog,
    lastAward,
    records,
    recordGame,
    deck,
    collectPhrases,
    reviewPhrase,
    mirrorDone,
    weekGoal,
    setWeekGoal,
    seen,
    markSeen,
    motion,
    setMotion,
    clearNotes,
    resetAll,
  }
}

export type AppState = ReturnType<typeof useAppStateValue>

export const AppStateContext = createContext<AppState | null>(null)

export function useAppState(): AppState {
  const v = useContext(AppStateContext)
  if (!v) throw new Error('useAppState must be used inside <AppStateProvider>')
  return v
}

/** Reduced motion = the OS setting or the in-app override. Mirrors the result onto <html data-motion>. */
export function useReducedMotion(): boolean {
  const { motion } = useAppState()
  const [system, setSystem] = useState(() => {
    try {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches
    } catch {
      return false
    }
  })
  useEffect(() => {
    let mq: MediaQueryList
    try {
      mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    } catch {
      return
    }
    const on = () => setSystem(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  const reduced = system || motion === 'reduce'
  useEffect(() => {
    document.documentElement.dataset.motion = reduced ? 'reduced' : 'full'
  }, [reduced])
  return reduced
}
