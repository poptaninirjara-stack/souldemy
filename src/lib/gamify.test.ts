import { describe, expect, it } from 'vitest'
import type { Catalog, ModuleSummary } from '../types/content'
import type { Game } from '../types/game'
import { earnedBadges, newCard, placeProgress, rankFor, RANKS, review, shuffle, totalXp, activeDays } from './gamify'

describe('ranks', () => {
  it('starts as a Fresher and moves up at each threshold', () => {
    expect(rankFor(0).rank.name).toBe('Fresher')
    expect(rankFor(RANKS[1].min - 1).rank.level).toBe(1)
    expect(rankFor(RANKS[1].min).rank.level).toBe(2)
    expect(rankFor(10_000).rank.name).toBe('Scholar-Professional')
    expect(rankFor(10_000).next).toBeUndefined()
  })

  it('reports progress to the next rank', () => {
    const r = rankFor(RANKS[1].min + (RANKS[2].min - RANKS[1].min) / 2)
    expect(r.pct).toBe(50)
    expect(r.toNext).toBe((RANKS[2].min - RANKS[1].min) / 2)
  })
})

describe('XP log', () => {
  it('sums XP and finds active days', () => {
    const log = { a: { xp: 10, date: '2026-10-12' }, b: { xp: 5, date: '2026-10-12' }, c: { xp: 15, date: '2026-10-14' } }
    expect(totalXp(log)).toBe(30)
    expect([...activeDays(log)].sort()).toEqual(['2026-10-12', '2026-10-14'])
  })
})

describe('spaced review (Leitner)', () => {
  it('a new card is due today', () => {
    expect(newCard('2026-10-14')).toEqual({ box: 1, due: '2026-10-14' })
  })
  it('moves up a box and further out when recalled; back to box 1 when missed', () => {
    const c1 = review({ box: 1, due: '2026-10-14' }, true, '2026-10-14')
    expect(c1).toEqual({ box: 2, due: '2026-10-17' })
    const c2 = review(c1, true, '2026-10-17')
    expect(c2).toEqual({ box: 3, due: '2026-10-24' })
    expect(review(c2, false, '2026-10-24')).toEqual({ box: 1, due: '2026-10-25' })
  })
  it('caps at the top box', () => {
    expect(review({ box: 5, due: '2026-10-14' }, true, '2026-10-14').box).toBe(5)
  })
})

const mod: ModuleSummary = {
  id: 'r1',
  trackId: 'research',
  number: 1,
  title: 'Academic Writing',
  metaHtml: [],
  outcomesHtml: [],
  lessonMap: [],
  pages: [
    { id: 'l1', title: 'One', number: 1 },
    { id: 'l2', title: 'Two', number: 2 },
  ],
  quizCount: 2,
  furtherReading: { heading: 'Further reading', items: [] },
}
const game: Game = {
  id: 'r1-registers',
  kind: 'sort',
  moduleId: 'r1',
  title: 'Register radar',
  intro: '',
  source: '',
  bins: [],
  items: [],
}

describe('place progress', () => {
  it('counts pages read and games played', () => {
    const none = placeProgress(mod, new Set(), [game], {})
    expect(none).toMatchObject({ pct: 0, started: false, complete: false })
    const some = placeProgress(mod, new Set(['r1/l1']), [game], {})
    expect(some.pct).toBe(33)
    const all = placeProgress(mod, new Set(['r1/l1', 'r1/l2']), [game], { 'r1-registers': { best: 3, total: 8, plays: 1 } })
    expect(all.complete).toBe(true)
  })
})

describe('badges', () => {
  const catalog: Catalog = { tracks: [{ id: 'research', title: 'R', introHtml: [], modules: [mod] }] }
  const base = {
    catalog,
    games: [game],
    phrases: [],
    visited: new Set<string>(),
    records: {},
    deck: {},
    log: {},
    quizCorrect: () => ({ correct: 0, total: 2 }),
    weeksMet: 0,
  }

  it('gives nothing before any activity', () => {
    expect(earnedBadges(base)).toEqual([])
  })

  it('rewards a first step, a perfect round and a finished place', () => {
    const ids = earnedBadges({
      ...base,
      log: { 'read:r1/l1': { xp: 10, date: '2026-10-14' } },
      visited: new Set(['r1/l1', 'r1/l2']),
      records: { 'r1-registers': { best: 8, total: 8, plays: 2 } },
    }).map((b) => b.id)
    expect(ids).toEqual(expect.arrayContaining(['first-step', 'place-r1', 'perfect-r1-registers']))
  })

  it('describes what the student can do', () => {
    const b = earnedBadges({ ...base, quizCorrect: () => ({ correct: 2, total: 2 }), log: { x: { xp: 5, date: '2026-10-14' } } })
    expect(b.find((x) => x.id === 'quiz-r1')?.can).toMatch(/^You /)
  })
})

describe('shuffle', () => {
  it('keeps every item', () => {
    const out = shuffle([1, 2, 3, 4, 5], () => 0.42)
    expect([...out].sort()).toEqual([1, 2, 3, 4, 5])
  })
})
