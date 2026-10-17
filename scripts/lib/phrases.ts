// Extracts phrase cards verbatim from the author's tables:
// - each communicative module's "Useful language" table (Purpose | phrases separated by " · ")
// - Module 1, Lesson 3 "Task words" table (Group | Word | What to do)
import type { Phrase } from '../../src/types/game.ts'
import { ContentError, normalise, parseTableRows, slug, splitHeadings } from './parse.ts'
import { mdPlain } from './markdown.ts'

const unquote = (s: string) => s.trim().replace(/^["“]|["”]$/g, '').trim()

export function extractCommPhrases(file: string, src: string): Phrase[] {
  const { chunks } = splitHeadings(normalise(src).slice(1), 2)
  const out: Phrase[] = []
  for (const c of chunks) {
    const m = /^Module (\d+):/.exec(c.title)
    if (!m) continue
    const moduleId = `c${m[1]}`
    const lang = splitHeadings(c.lines, 3).chunks.find((s) => s.title.startsWith('Useful language'))
    if (!lang) throw new ContentError(file, `Module ${m[1]}: no "Useful language" section to extract phrases from.`)
    const rows = parseTableRows(lang.lines)
    if (!rows.length) throw new ContentError(file, `Module ${m[1]}: "Useful language" has no table rows.`)
    for (const [purpose, phrases] of rows) {
      for (const raw of phrases.split(/\s+·\s+/)) {
        const answer = unquote(mdPlain(raw))
        if (!answer) continue
        out.push({ id: `${moduleId}-${slug(answer).slice(0, 48)}`, moduleId, prompt: mdPlain(purpose), answer, kind: 'phrase' })
      }
    }
  }
  return out
}

export function extractTaskWords(file: string, src: string): Phrase[] {
  const { chunks } = splitHeadings(normalise(src).slice(1), 2)
  const lesson = chunks.find((c) => c.title.startsWith('Lesson 3:'))
  const table = lesson && splitHeadings(lesson.lines, 3).chunks.find((s) => s.title === 'Task words')
  if (!table) throw new ContentError(file, 'Lesson 3 "Task words" table not found for phrase cards.')
  return parseTableRows(table.lines).map(([, word, what]) => {
    const answer = mdPlain(word)
    return { id: `r1-tw-${slug(answer)}`, moduleId: 'r1', prompt: mdPlain(what), answer, kind: 'taskword' as const }
  })
}
