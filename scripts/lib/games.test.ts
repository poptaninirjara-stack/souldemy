import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { buildGames } from './games.ts'
import { escapeOverflowPipes } from './markdown.ts'
import { ContentError, FILES, parseAll } from './parse.ts'
import { extractCommPhrases, extractTaskWords } from './phrases.ts'

const dir = join(__dirname, '..', '..', 'content')
const read = (f: string) => readFileSync(join(dir, f), 'utf8')
const src = { module1: read(FILES.module1), module2: read(FILES.module2), communication: read(FILES.communication) }
const { catalog } = parseAll(src)
const phrases = [...extractTaskWords(FILES.module1, src.module1), ...extractCommPhrases(FILES.communication, src.communication)]
const raw = JSON.parse(read('games.json'))

describe('phrase cards', () => {
  it('takes the 16 task words and every useful-language phrase verbatim', () => {
    expect(phrases.filter((p) => p.kind === 'taskword')).toHaveLength(16)
    expect(phrases.find((p) => p.answer === 'Evaluate / Assess')?.prompt).toBe(
      'Judge strengths and weaknesses, with reasons, and reach a conclusion',
    )
    expect(phrases.some((p) => p.answer === "That brings me to my second point.")).toBe(true)
  })

  it('keeps a table cell that contains "|" whole (LinkedIn headline)', () => {
    expect(phrases.find((p) => p.prompt === 'LinkedIn headline pattern')?.answer).toBe(
      'BA English student | Editor | Interested in publishing and communications',
    )
  })
})

describe('escapeOverflowPipes', () => {
  it('only touches rows wider than the header', () => {
    const md = '| A | B |\n|---|---|\n| x | "p | q | r" |\n| y | z |'
    expect(escapeOverflowPipes(md)).toBe(String.raw`| A | B |` + '\n|---|---|\n' + String.raw`| x | "p \| q \| r" |` + '\n| y | z |')
  })
})

describe('game bundle', () => {
  const bundle = buildGames(raw, phrases, catalog)

  it('builds the hand-written and generated games', () => {
    expect(bundle.games.map((g) => g.id)).toEqual(expect.arrayContaining(['r1-registers', 'c2-inbox', 'r1-taskwords', 'c1-phrases']))
    expect(bundle.mirror.map((m) => m.moduleId)).toEqual(['c1', 'c3', 'c4'])
  })

  it('every pick item has its answer among the options and every scenario step a good choice', () => {
    for (const g of bundle.games) {
      if (g.kind === 'pick') for (const it of g.items) expect(it.options[it.correct]).toBeTruthy()
      if (g.kind === 'scenario') for (const s of g.steps) expect(s.choices.some((c) => c.good)).toBe(true)
    }
  })

  it('rejects a broken game loudly', () => {
    const broken = { ...raw, games: [{ ...raw.games[0], items: [{ text: 'x', bin: 'nope', why: '' }, ...raw.games[0].items] }] }
    expect(() => buildGames(broken, phrases, catalog)).toThrow(ContentError)
    const badPlace = { ...raw, games: [{ ...raw.games[0], after: 'l99' }] }
    expect(() => buildGames(badPlace, phrases, catalog)).toThrow(/l99/)
  })
})
