// Weekly practice record: the student sets a goal in hours and logs practice by hand.
// No timers. Weeks start on Monday in Asia/Kolkata. Kept in one module so the rules are
// easy to change.
import { PRACTICE_TIME_ZONE } from '../config'

export interface PracticeLog {
  /** Calendar date in PRACTICE_TIME_ZONE, YYYY-MM-DD. */
  date: string
  hours: number
}

export interface WeeklyState {
  targetHours: number | null
  logs: PracticeLog[]
}

export const EMPTY_WEEKLY: WeeklyState = { targetHours: null, logs: [] }

const DAY_MS = 86_400_000

/** Today's date (YYYY-MM-DD) in the practice time zone. */
export function todayISO(now: Date = new Date()): string {
  // en-CA formats as YYYY-MM-DD
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: PRACTICE_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
}

function toUTC(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number)
  return Date.UTC(y, m - 1, d)
}

function fromUTC(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10)
}

export function addDays(iso: string, n: number): string {
  return fromUTC(toUTC(iso) + n * DAY_MS)
}

/** Monday of the week containing `iso`. */
export function weekStart(iso: string): string {
  const dow = new Date(toUTC(iso)).getUTCDay() // 0 = Sunday
  const back = (dow + 6) % 7
  return addDays(iso, -back)
}

export function weekDays(start: string): string[] {
  return Array.from({ length: 7 }, (_, i) => addDays(start, i))
}

export function hoursOn(logs: PracticeLog[], iso: string): number {
  return logs.filter((l) => l.date === iso).reduce((n, l) => n + l.hours, 0)
}

export function hoursInWeek(logs: PracticeLog[], start: string): number {
  const days = new Set(weekDays(start))
  return logs.filter((l) => days.has(l.date)).reduce((n, l) => n + l.hours, 0)
}

/**
 * Consecutive weeks, counting back from the most recent week, in which the goal was met.
 * The current week counts once met; if it is not met yet, counting starts from last week,
 * so an unfinished week never breaks the record.
 */
export function weeksGoalMet(state: WeeklyState, today: string = todayISO()): number {
  const goal = state.targetHours
  if (!goal) return 0
  let start = weekStart(today)
  if (hoursInWeek(state.logs, start) < goal) start = addDays(start, -7)
  let n = 0
  while (hoursInWeek(state.logs, start) >= goal) {
    n++
    start = addDays(start, -7)
  }
  return n
}

/** "1 h 10 min", "45 min", "2 h", "0 min". */
export function formatHours(hours: number): string {
  const total = Math.round(hours * 60)
  const h = Math.floor(total / 60)
  const m = total % 60
  if (h && m) return `${h} h ${m} min`
  if (h) return `${h} h`
  return `${m} min`
}

export function isWeeklyState(v: unknown): v is WeeklyState {
  if (!v || typeof v !== 'object') return false
  const o = v as WeeklyState
  return (
    (o.targetHours === null || typeof o.targetHours === 'number') &&
    Array.isArray(o.logs) &&
    o.logs.every((l) => typeof l?.date === 'string' && typeof l?.hours === 'number')
  )
}

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
export const dayName = (i: number) => DAY_NAMES[i]
export const dayLetter = (i: number) => DAY_NAMES[i][0]

/** The one line under the week strip. No flames, no streak-loss warnings. */
export function streakLine(weeks: number, hasGoal: boolean): string {
  if (!hasGoal) return 'Choose how many hours a week you want to practise.'
  if (weeks === 0) return 'Practise on any day this week to start your record.'
  if (weeks === 1) return 'You met your weekly goal last week.'
  return `You met your weekly goal for the last ${weeks} weeks.`
}
