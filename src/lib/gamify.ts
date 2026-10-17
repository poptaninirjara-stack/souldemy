// The game layer, as pure functions: XP, ranks, spaced review and badges.
// XP is earned only for effortful work and only once per event key, so re-reading or
// replaying the same thing the same day cannot farm it. There is nothing to spend it on.
import type { Catalog, ModuleSummary } from '../types/content'
import type { Game, Phrase } from '../types/game'
import { pageKey } from './content'
import { addDays } from './weekly'

export interface XpEvent {
  xp: number
  /** Practice date (YYYY-MM-DD, Asia/Kolkata). */
  date: string
}

export type XpLog = Record<string, XpEvent>

export const XP = {
  lessonRead: 10,
  sectionRead: 5,
  exerciseTried: 15,
  quizCorrect: 5,
  gameDone: 20,
  gamePerfect: 15,
  phraseCollected: 1,
  reviewCorrect: 2,
  mirrorDone: 15,
} as const

/** Event keys: one award per key, ever (date-scoped keys allow one per day). */
export const xpKey = {
  read: (moduleId: string, pageId: string) => `read:${pageKey(moduleId, pageId)}`,
  exercise: (id: string) => `try:${id}`,
  quiz: (itemId: string) => `quiz:${itemId}`,
  game: (gameId: string, date: string) => `game:${gameId}:${date}`,
  perfect: (gameId: string) => `perfect:${gameId}`,
  collect: (phraseId: string) => `collect:${phraseId}`,
  review: (phraseId: string, date: string) => `review:${phraseId}:${date}`,
  mirror: (moduleId: string, date: string) => `mirror:${moduleId}:${date}`,
}

export const totalXp = (log: XpLog) => Object.values(log).reduce((n, e) => n + e.xp, 0)
export const activeDays = (log: XpLog) => new Set(Object.values(log).map((e) => e.date))

// ---------- Ranks: can-do statements, not just numbers ----------

export interface Rank {
  level: number
  name: string
  min: number
  can: string
}

export const RANKS: Rank[] = [
  { level: 1, name: 'Fresher', min: 0, can: 'You have started. Every place on campus is open to you.' },
  { level: 2, name: 'Note-taker', min: 100, can: 'You can tell registers apart and decode task words.' },
  { level: 3, name: 'Writer', min: 300, can: 'You can build an answer and write in academic style.' },
  { level: 4, name: 'Researcher', min: 600, can: 'You can find, read and judge scholarly sources.' },
  { level: 5, name: 'Presenter', min: 950, can: 'You can present, write professional email and answer interview questions.' },
  { level: 6, name: 'Scholar-Professional', min: 1400, can: 'You move between academic and professional English with confidence.' },
]

export function rankFor(xp: number) {
  let i = 0
  while (i + 1 < RANKS.length && xp >= RANKS[i + 1].min) i++
  const rank = RANKS[i]
  const next = RANKS[i + 1]
  const into = xp - rank.min
  const span = next ? next.min - rank.min : 1
  return { rank, next, pct: next ? Math.min(100, Math.round((into / span) * 100)) : 100, toNext: next ? next.min - xp : 0 }
}

// ---------- Spaced review (Leitner boxes) ----------

export interface DeckCard {
  box: number
  due: string
}
export type Deck = Record<string, DeckCard>

/** Days until the next review for each box (box 1 = due next day). */
export const BOX_DAYS = [0, 1, 3, 7, 14, 30]

export function review(card: DeckCard, correct: boolean, today: string): DeckCard {
  const box = correct ? Math.min(card.box + 1, BOX_DAYS.length - 1) : 1
  return { box, due: addDays(today, BOX_DAYS[box]) }
}

export const isDue = (card: DeckCard, today: string) => card.due <= today
export const newCard = (today: string): DeckCard => ({ box: 1, due: today })

// ---------- Game results ----------

export interface GameRecord {
  best: number
  total: number
  plays: number
}
export type GameRecords = Record<string, GameRecord>

// ---------- Place (module) progress ----------

export interface PlaceProgress {
  read: number
  pages: number
  played: number
  games: number
  pct: number
  complete: boolean
  started: boolean
}

export function placeProgress(m: ModuleSummary, visited: Set<string>, games: Game[], records: GameRecords): PlaceProgress {
  const read = m.pages.filter((p) => visited.has(pageKey(m.id, p.id))).length
  const mine = games.filter((g) => g.moduleId === m.id)
  const played = mine.filter((g) => records[g.id]?.plays).length
  const done = read + played
  const all = m.pages.length + mine.length
  return {
    read,
    pages: m.pages.length,
    played,
    games: mine.length,
    pct: all ? Math.round((done / all) * 100) : 0,
    complete: all > 0 && done === all,
    started: done > 0,
  }
}

// ---------- Badges: surprises that describe a skill ----------

export interface Badge {
  id: string
  title: string
  /** What the student can now do. */
  can: string
  icon: string
}

export interface BadgeInput {
  catalog: Catalog
  games: Game[]
  phrases: Phrase[]
  visited: Set<string>
  records: GameRecords
  deck: Deck
  log: XpLog
  quizCorrect: (moduleId: string) => { correct: number; total: number }
  weeksMet: number
}

const PLACE_BADGES: Record<string, { title: string; icon: string }> = {
  r1: { title: 'Exam Hall cleared', icon: '📝' },
  r2: { title: 'Library card', icon: '📚' },
  c1: { title: 'Seminar ready', icon: '🎤' },
  c2: { title: 'Inbox pro', icon: '✉️' },
  c3: { title: 'CV sharpened', icon: '🗂️' },
  c4: { title: 'Interview ready', icon: '🤝' },
}

const PERFECT_BADGES: Record<string, Omit<Badge, 'id'>> = {
  'r1-registers': { title: 'Register radar', can: 'You can hear the difference between casual, journalistic and academic English.', icon: '📡' },
  'r1-hedge': { title: 'Hedge hero', can: 'You can turn a bold claim into a careful academic one.', icon: '🌿' },
  'r1-surgery': { title: 'Sentence surgeon', can: 'You can spot fragments, dangling modifiers and faulty parallelism.', icon: '🩺' },
  'r1-taskwords': { title: 'Question decoder', can: 'You know what every task word asks you to do.', icon: '🔑' },
  'r2-desk': { title: 'Library navigator', can: 'You know where to go for theses, articles and books.', icon: '🧭' },
  'c2-inbox': { title: 'Reply-worthy', can: 'You can write an email a professor will answer.', icon: '📨' },
  'c4-interview': { title: 'Calm in the chair', can: 'You can answer common interview questions clearly.', icon: '🪑' },
}

export function earnedBadges(i: BadgeInput): Badge[] {
  const out: Badge[] = []
  const keys = Object.keys(i.log)
  if (keys.length) out.push({ id: 'first-step', title: 'First step', can: 'You started. That is the hardest part.', icon: '👣' })

  for (const t of i.catalog.tracks)
    for (const m of t.modules) {
      if (placeProgress(m, i.visited, i.games, i.records).complete) {
        const b = PLACE_BADGES[m.id]
        out.push({ id: `place-${m.id}`, title: b?.title ?? `${m.title} complete`, can: `You finished every lesson and game in ${m.title}.`, icon: b?.icon ?? '🏁' })
      }
      const q = i.quizCorrect(m.id)
      if (q.total > 0 && q.correct === q.total)
        out.push({ id: `quiz-${m.id}`, title: 'Quiz ace', can: `You answered every ${m.title} quiz question correctly.`, icon: '🎯' })
    }

  for (const [gameId, b] of Object.entries(PERFECT_BADGES)) {
    const r = i.records[gameId]
    if (r && r.total > 0 && r.best === r.total) out.push({ id: `perfect-${gameId}`, ...b })
  }

  const collected = Object.keys(i.deck).length
  if (collected >= 10) out.push({ id: 'collector-10', title: 'Phrase collector', can: 'You have ten useful phrases ready to use.', icon: '🃏' })
  if (i.phrases.length && collected >= i.phrases.length)
    out.push({ id: 'collector-all', title: 'Full deck', can: 'You collected every phrase in the course.', icon: '🗃️' })
  const reviews = keys.filter((k) => k.startsWith('review:')).length
  if (reviews >= 25) out.push({ id: 'memory-25', title: 'Memory keeper', can: 'You recalled 25 phrases from memory.', icon: '🧠' })
  if (keys.some((k) => k.startsWith('mirror:'))) out.push({ id: 'voice', title: 'Found my voice', can: 'You rehearsed out loud. Speaking gets easier each time.', icon: '🔊' })
  if (i.weeksMet >= 1) out.push({ id: 'week-1', title: 'Good week', can: 'You met your weekly practice goal.', icon: '📅' })
  if (i.weeksMet >= 4) out.push({ id: 'week-4', title: 'Steady habit', can: 'Four weeks in a row. This is how skills stick.', icon: '🌱' })
  return out
}

/** Fisher–Yates shuffle with an injectable random source (for tests). */
export function shuffle<T>(arr: T[], rnd: () => number = Math.random): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** How many badges exist, so "n more to discover" stays honest without naming them. */
export function possibleBadgeCount(catalog: Catalog): number {
  const modules = catalog.tracks.flatMap((t) => t.modules)
  const fixed = 1 /* first step */ + 2 /* collectors */ + 1 /* memory */ + 1 /* voice */ + 2 /* weeks */
  return fixed + modules.length + modules.filter((m) => m.quizCount > 0).length + Object.keys(PERFECT_BADGES).length
}
