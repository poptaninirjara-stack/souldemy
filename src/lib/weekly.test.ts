import { describe, expect, it } from 'vitest'
import { addDays, formatHours, todayISO, weekStart, weeksGoalMet } from './weekly'

describe('weekly practice', () => {
  it('starts weeks on Monday', () => {
    expect(weekStart('2026-10-14')).toBe('2026-10-12') // Wednesday → Monday
    expect(weekStart('2026-10-12')).toBe('2026-10-12')
    expect(weekStart('2026-10-18')).toBe('2026-10-12') // Sunday belongs to the same week
  })

  it('uses the Asia/Kolkata calendar date', () => {
    // 20:00 UTC on 13 Oct is 01:30 on 14 Oct in India.
    expect(todayISO(new Date('2026-10-13T20:00:00Z'))).toBe('2026-10-14')
  })

  it('counts consecutive weeks where the goal was met; an unfinished week does not break it', () => {
    const today = '2026-10-14'
    const lastMon = addDays(weekStart(today), -7)
    const logs = [
      { date: lastMon, hours: 2 },
      { date: addDays(lastMon, -7), hours: 1 },
      { date: addDays(lastMon, -6), hours: 1.5 },
      { date: addDays(lastMon, -14), hours: 0.5 },
    ]
    expect(weeksGoalMet({ targetHours: 2, logs }, today)).toBe(2)
    expect(weeksGoalMet({ targetHours: 2, logs: [...logs, { date: today, hours: 2 }] }, today)).toBe(3)
    expect(weeksGoalMet({ targetHours: null, logs }, today)).toBe(0)
  })

  it('formats hours plainly', () => {
    expect(formatHours(1 + 10 / 60)).toBe('1 h 10 min')
    expect(formatHours(0.75)).toBe('45 min')
    expect(formatHours(3)).toBe('3 h')
    expect(formatHours(0)).toBe('0 min')
  })
})
