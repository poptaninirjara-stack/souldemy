import { describe, expect, it } from 'vitest'
import { activeDaysInWeek, addDays, todayISO, weekLine, weekStart, weeksGoalMet } from './weekly'

describe('weekly goal', () => {
  it('starts weeks on Monday', () => {
    expect(weekStart('2026-10-14')).toBe('2026-10-12') // Wednesday → Monday
    expect(weekStart('2026-10-12')).toBe('2026-10-12')
    expect(weekStart('2026-10-18')).toBe('2026-10-12') // Sunday belongs to the same week
  })

  it('uses the Asia/Kolkata calendar date', () => {
    // 20:00 UTC on 13 Oct is 01:30 on 14 Oct in India.
    expect(todayISO(new Date('2026-10-13T20:00:00Z'))).toBe('2026-10-14')
  })

  it('counts distinct active days in a week', () => {
    const days = new Set(['2026-10-12', '2026-10-14', '2026-10-19'])
    expect(activeDaysInWeek(days, '2026-10-12')).toBe(2)
  })

  it('counts consecutive goal-met weeks; an unfinished week does not break the record', () => {
    const today = '2026-10-21' // Wednesday
    const lastMon = addDays(weekStart(today), -7)
    const week = (start: string, n: number) => Array.from({ length: n }, (_, i) => addDays(start, i))
    const days = new Set([...week(lastMon, 4), ...week(addDays(lastMon, -7), 3), ...week(addDays(lastMon, -14), 1)])
    expect(weeksGoalMet(days, 3, today)).toBe(2)
    expect(weeksGoalMet(days, 4, today)).toBe(1)
    const withThisWeek = new Set([...days, ...week(weekStart(today), 3)])
    expect(weeksGoalMet(withThisWeek, 3, today)).toBe(3)
  })

  it('says something encouraging, never a warning', () => {
    expect(weekLine(1, 4, 0)).toBe('3 more days of practice reaches this week\'s goal.')
    expect(weekLine(4, 4, 1)).toBe('Goal met for this week. Nice.')
    expect(weekLine(5, 4, 3)).toBe("Goal met. That's 3 weeks in a row.")
    expect(weekLine(0, 3, 2)).toMatch(/^2 weeks in a row so far/)
    for (const l of [weekLine(0, 5, 0), weekLine(2, 5, 4)]) expect(l).not.toMatch(/lose|lost|break|miss/i)
  })
})
