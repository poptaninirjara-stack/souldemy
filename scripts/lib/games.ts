// Assembles the game bundle: hand-written games from content/games.json, plus games generated
// from the author's own tables (task words, useful-language phrases). Validates everything.
import type { Catalog } from '../../src/types/content.ts'
import type { Game, GameBundle, MirrorTask, PickGame, Phrase } from '../../src/types/game.ts'
import { ContentError } from './parse.ts'

const FILE = 'games.json'
const PLACE_NAMES: Record<string, string> = {
  c1: 'Seminar Room',
  c2: 'Email Desk',
  c3: 'CV Desk',
  c4: 'Interview Room',
}

/** Deterministic distractors: the same build always produces the same options. */
function distractors<T>(pool: T[], exclude: (t: T) => boolean, seed: number, n: number): T[] {
  const candidates = pool.filter((t) => !exclude(t))
  const out: T[] = []
  for (let k = 0; out.length < Math.min(n, candidates.length); k++) {
    const c = candidates[(seed * 7 + k * 5) % candidates.length]
    if (!out.includes(c)) out.push(c)
    if (k > candidates.length * 6) break
  }
  return out
}

/** Place the correct answer at a position that varies by item. */
function withAnswer(correct: string, wrong: string[], seed: number) {
  const options = [...wrong]
  const at = seed % (options.length + 1)
  options.splice(at, 0, correct)
  return { options, correct: at }
}

export function taskWordGame(phrases: Phrase[]): PickGame {
  const words = phrases.filter((p) => p.kind === 'taskword')
  return {
    id: 'r1-taskwords',
    kind: 'pick',
    moduleId: 'r1',
    after: 'l3',
    title: 'Task-word decoder',
    intro: 'Exam questions hide instructions in one word. Match the instruction to the word.',
    ask: 'Which task word asks you to do this?',
    source: 'Lesson 3 "Task words" table',
    items: words.map((w, i) => {
      const wrong = distractors(words, (x) => x.answer === w.answer, i, 3).map((x) => x.answer)
      return { prompt: w.prompt, ...withAnswer(w.answer, wrong, i), why: `${w.answer}: ${w.prompt}` }
    }),
  }
}

export function phraseGame(moduleId: string, phrases: Phrase[]): PickGame {
  const mine = phrases.filter((p) => p.moduleId === moduleId && p.kind === 'phrase')
  return {
    id: `${moduleId}-phrases`,
    kind: 'pick',
    moduleId,
    after: 'language',
    title: 'Right phrase, right moment',
    intro: `Phrases from the ${PLACE_NAMES[moduleId] ?? 'module'} "Useful language" table. Pick the one that does the job.`,
    ask: 'Which phrase would you use for this?',
    source: '"Useful language" table',
    items: mine.map((p, i) => {
      const wrong = distractors(mine, (x) => x.prompt === p.prompt, i, 2).map((x) => x.answer)
      return { prompt: p.prompt, ...withAnswer(p.answer, wrong, i), why: `"${p.answer}" is for: ${p.prompt}.` }
    }),
  }
}

export function buildGames(raw: unknown, phrases: Phrase[], catalog: Catalog): GameBundle {
  if (!raw || typeof raw !== 'object') throw new ContentError(FILE, 'not a JSON object.')
  const { games, mirror } = raw as { games: Game[]; mirror: MirrorTask[] }
  if (!Array.isArray(games) || !Array.isArray(mirror)) throw new ContentError(FILE, 'needs "games" and "mirror" arrays.')

  const all: Game[] = [...games, taskWordGame(phrases), ...['c1', 'c2', 'c3', 'c4'].map((m) => phraseGame(m, phrases))]
  const modules = new Map(catalog.tracks.flatMap((t) => t.modules).map((m) => [m.id, m]))
  const ids = new Set<string>()

  for (const g of all) {
    const where = `game "${g.id}"`
    if (ids.has(g.id)) throw new ContentError(FILE, `${where}: duplicate id.`)
    ids.add(g.id)
    const mod = modules.get(g.moduleId)
    if (!mod) throw new ContentError(FILE, `${where}: unknown module "${g.moduleId}".`)
    if (g.after && !mod.pages.some((p) => p.id === g.after)) throw new ContentError(FILE, `${where}: "after" page "${g.after}" is not in ${g.moduleId}.`)
    if (g.kind === 'sort') {
      const bins = new Set(g.bins.map((b) => b.id))
      if (bins.size < 2) throw new ContentError(FILE, `${where}: needs at least 2 bins.`)
      g.items.forEach((it, i) => {
        if (!bins.has(it.bin)) throw new ContentError(FILE, `${where} item ${i + 1}: bin "${it.bin}" does not exist.`)
      })
      if (g.items.length < 4) throw new ContentError(FILE, `${where}: needs at least 4 items.`)
    } else if (g.kind === 'pick') {
      g.items.forEach((it, i) => {
        if (it.options.length < 2) throw new ContentError(FILE, `${where} item ${i + 1}: needs at least 2 options.`)
        if (it.correct < 0 || it.correct >= it.options.length) throw new ContentError(FILE, `${where} item ${i + 1}: "correct" is out of range.`)
        if (new Set(it.options).size !== it.options.length) throw new ContentError(FILE, `${where} item ${i + 1}: duplicate options.`)
      })
      if (g.items.length < 3) throw new ContentError(FILE, `${where}: needs at least 3 items.`)
    } else if (g.kind === 'scenario') {
      g.steps.forEach((s, i) => {
        if (!s.choices.some((c) => c.good)) throw new ContentError(FILE, `${where} step ${i + 1}: no good choice.`)
      })
    } else {
      throw new ContentError(FILE, `${where}: unknown kind.`)
    }
  }

  for (const m of mirror) {
    if (!modules.has(m.moduleId)) throw new ContentError(FILE, `mirror task: unknown module "${m.moduleId}".`)
    if (!m.task || !m.checklist?.length) throw new ContentError(FILE, `mirror task for ${m.moduleId}: needs a task and a checklist.`)
  }

  const phraseIds = new Set<string>()
  for (const p of phrases) {
    if (phraseIds.has(p.id)) throw new ContentError(FILE, `duplicate phrase id "${p.id}".`)
    phraseIds.add(p.id)
  }

  return { games: all, mirror, phrases }
}
