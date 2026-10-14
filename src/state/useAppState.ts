// App-wide state: everything here is stored on the device only (see lib/storage.ts).
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { isTrackId, pageKey } from '../lib/content'
import { clearAll, load, migrate, remove, save } from '../lib/storage'
import { EMPTY_WEEKLY, isWeeklyState, todayISO, type WeeklyState } from '../lib/weekly'
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

const isObject = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v)
const isStringArray = (v: unknown) => Array.isArray(v) && v.every((x) => typeof x === 'string')
const isLastLocation = (v: unknown) =>
  isObject(v) && isTrackId(v.trackId) && typeof v.moduleId === 'string' && typeof v.pageId === 'string'

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

  const [track, setTrack] = usePersistent<TrackId | null>('track', null, (v) => v === null || isTrackId(v))
  const [visited, setVisited] = usePersistent<string[]>('visited', [], isStringArray)
  const [lastLocation, setLastLocation] = usePersistent<LastLocation | null>('lastLocation', null, (v) => v === null || isLastLocation(v))
  const [attempts, setAttempts] = usePersistent<Record<string, Attempt>>('attempts', {}, isObject)
  const [quiz, setQuiz] = usePersistent<Record<string, QuizAnswer>>('quiz', {}, isObject)
  const [weekly, setWeekly] = usePersistent<WeeklyState>('weekly', EMPTY_WEEKLY, isWeeklyState)
  const [motion, setMotion] = usePersistent<MotionPref>('ui', 'system', (v) => v === 'system' || v === 'reduce')

  const visitedSet = useMemo(() => new Set(visited), [visited])

  const markVisited = useCallback(
    (moduleId: string, pageId: string) => {
      const k = pageKey(moduleId, pageId)
      setVisited((prev) => (prev.includes(k) ? prev : [...prev, k]))
    },
    [setVisited],
  )

  const setAttemptText = useCallback(
    (id: string, text: string) => setAttempts((prev) => ({ ...prev, [id]: { text, revealed: prev[id]?.revealed ?? false } })),
    [setAttempts],
  )
  const revealAnswer = useCallback(
    (id: string) => setAttempts((prev) => ({ ...prev, [id]: { text: prev[id]?.text ?? '', revealed: true } })),
    [setAttempts],
  )
  const setQuizAnswer = useCallback(
    (id: string, answer: QuizAnswer) => setQuiz((prev) => ({ ...prev, [id]: answer })),
    [setQuiz],
  )

  const setGoal = useCallback((hours: number) => setWeekly((w) => ({ ...w, targetHours: hours })), [setWeekly])
  const logPractice = useCallback(
    (hours: number, date: string = todayISO()) => setWeekly((w) => ({ ...w, logs: [...w.logs, { date, hours }] })),
    [setWeekly],
  )
  const removeLog = useCallback(
    (index: number) => setWeekly((w) => ({ ...w, logs: w.logs.filter((_, i) => i !== index) })),
    [setWeekly],
  )

  const clearNotes = useCallback(() => {
    remove('attempts')
    remove('quiz')
    setAttempts({})
    setQuiz({})
  }, [setAttempts, setQuiz])

  /** Wipe everything this app stored and start again from the welcome page. */
  const resetAll = useCallback(() => {
    clearAll()
    window.location.hash = '#/'
    window.location.reload()
  }, [])

  return {
    track,
    setTrack,
    visited: visitedSet,
    markVisited,
    lastLocation,
    setLastLocation,
    attempts,
    setAttemptText,
    revealAnswer,
    quiz,
    setQuizAnswer,
    weekly,
    setGoal,
    logPractice,
    removeLog,
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
