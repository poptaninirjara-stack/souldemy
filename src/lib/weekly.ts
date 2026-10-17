// Weekly goal: practise on N of 7 days (default 4). A day counts when the student did any
// practice that earned XP. No timers, no daily streak, no loss messages. Weeks start on
// Monday in Asia/Kolkata. Kept in one module so the rules are easy to change.
import { PRACTICE_TIME_ZONE } from '../config'

const DAY_MS = 86_400_000

/** Today's date (YYYY-MM-DD) in the practice time zone. */
export function todayISO(now: Date = new Date()): string {
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

export function addDays(iso: string, n: number): string {
  return new Date(toUTC(iso) + n * DAY_MS).toISOString().slice(0, 10)
}

/** Monday of the week containing `iso`. */
export function weekStart(iso: string): string {
  const dow = new Date(toUTC(iso)).getUTCDay() // 0 = Sunday
  return addDays(iso, -((dow + 6) % 7))
}

export function weekDays(start: string): string[] {
  return Array.from({ length: 7 }, (_, i) => addDays(start, i))
}

export function activeDaysInWeek(days: Set<string>, start: string): number {
  return weekDays(start).filter((d) => days.has(d)).length
}

/**
 * Consecutive weeks, counting back from the most recent, in which the goal was met.
 * The current week counts once met; if it is not met yet, counting starts from last week,
 * so an unfinished week never breaks the record.
 */
export function weeksGoalMet(days: Set<string>, goal: number, today: string = todayISO()): number {
  let start = weekStart(today)
  if (activeDaysInWeek(days, start) < goal) start = addDays(start, -7)
  let n = 0
  while (activeDaysInWeek(days, start) >= goal) {
    n++
    start = addDays(start, -7)
  }
  return n
}

/** The one line under the week dots. Encouraging, never a warning. */
export function weekLine(done: number, goal: number, weeks: number): string {
  if (done >= goal) return weeks > 1 ? `Goal met. That's ${weeks} weeks in a row.` : 'Goal met for this week. Nice.'
  const left = goal - done
  const lead = weeks > 0 ? `${weeks} ${weeks === 1 ? 'week' : 'weeks'} in a row so far. ` : ''
  return `${lead}${left} more ${left === 1 ? 'day' : 'days'} of practice reaches this week's goal.`
}

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
export const dayName = (i: number) => DAY_NAMES[i]
export const dayLetter = (i: number) => DAY_NAMES[i][0]
