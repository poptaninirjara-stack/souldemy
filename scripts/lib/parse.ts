// Parses the course Markdown files into typed content.
// Throws ContentError with a clear message whenever the structure is not what we expect,
// so the build never emits partial content silently.
import type {
  Block,
  CommSection,
  CommSectionKind,
  FurtherReading,
  LessonMapRow,
  Lesson,
  ModuleContent,
  ModuleSummary,
  QuizItem,
  ReadingItem,
  Track,
} from '../../src/types/content.ts'
import { escapeOverflowPipes, mdInline, mdPlain, mdToHtml } from './markdown.ts'

export class ContentError extends Error {
  constructor(file: string, message: string) {
    super(`[content] ${file}: ${message}`)
    this.name = 'ContentError'
  }
}

/** Things deliberately left out of the rendered app (constraint 5 / content build notes). */
export interface Omission {
  file: string
  what: string
}

interface Chunk {
  title: string
  lines: string[]
}

export function normalise(src: string): string[] {
  return src.replace(/\r\n?/g, '\n').split('\n')
}

/** Split lines on headings of exactly `level` hashes. Returns the preamble and the chunks. */
export function splitHeadings(lines: string[], level: number): { preamble: string[]; chunks: Chunk[] } {
  const re = new RegExp(`^#{${level}} (.+?)\\s*$`)
  const preamble: string[] = []
  const chunks: Chunk[] = []
  for (const line of lines) {
    const m = re.exec(line)
    if (m) chunks.push({ title: m[1], lines: [] })
    else if (chunks.length) chunks[chunks.length - 1].lines.push(line)
    else preamble.push(line)
  }
  return { preamble: trimBlock(preamble), chunks: chunks.map((c) => ({ ...c, lines: trimBlock(c.lines) })) }
}

/** Drop leading/trailing blank lines and horizontal rules. */
function trimBlock(lines: string[]): string[] {
  const isFiller = (l: string) => l.trim() === '' || /^-{3,}\s*$/.test(l)
  let a = 0
  let b = lines.length
  while (a < b && isFiller(lines[a])) a++
  while (b > a && isFiller(lines[b - 1])) b--
  return lines.slice(a, b)
}

const join = (lines: string[]) => lines.join('\n')

export const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

/** Non-empty lines rendered one paragraph each (metadata blocks use soft line breaks). */
function linesAsParagraphs(lines: string[]): string[] {
  return lines.filter((l) => l.trim()).map((l) => mdInline(l.trim()))
}

export function parseTableRows(lines: string[]): string[][] {
  const rows = escapeOverflowPipes(lines.join('\n'))
    .split('\n')
    .filter((l) => l.trim().startsWith('|'))
  return rows
    .slice(2) // header + separator
    .map((r) =>
      r
        .trim()
        .replace(/^\||\|$/g, '')
        .split(/(?<!\\)\|/)
        .map((c) => c.replace(/\\\|/g, '|').trim()),
    )
}

// ---------- Further reading ----------

const LINK_RE = /\[([^\]]+)\]\(([^)\s]+)\)/g

export function parseFurtherReading(file: string, heading: string, lines: string[]): FurtherReading {
  const items: ReadingItem[] = []
  const after: string[] = []
  for (const line of lines) {
    if (/^\s*-\s+/.test(line)) {
      if (after.length) throw new ContentError(file, `"${heading}": a list item follows a paragraph; expected the list first.`)
      const md = line.replace(/^\s*-\s+/, '')
      const links = [...md.matchAll(LINK_RE)].map((m) => ({ title: m[1], url: m[2] }))
      let source = mdPlain(md)
      let note: string | undefined
      if (links.length) {
        const first = md.indexOf('[')
        const lastMatch = [...md.matchAll(LINK_RE)].pop()!
        const tail = md.slice((lastMatch.index ?? 0) + lastMatch[0].length)
        source = mdPlain(md.slice(0, first)).replace(/[,:;]\s*$/, '').trim()
        const n = mdPlain(tail).replace(/^[:;,.]\s*/, '').trim()
        note = n || undefined
      }
      items.push({ html: mdInline(md), links, source, note })
    } else if (line.trim()) {
      after.push(line)
    }
  }
  if (!items.length) throw new ContentError(file, `"${heading}" has no list items.`)
  return {
    heading,
    items,
    afterHtml: after.length ? mdToHtml(join(after)) : undefined,
  }
}

// ---------- Quiz ----------

export function parseQuiz(file: string, idPrefix: string, lines: string[]): QuizItem[] {
  const items: { n: string; q: string; rest: string[] }[] = []
  for (const line of lines) {
    const m = /^(\d+)\.\s+\*\*(.+)\*\*\s*$/.exec(line)
    if (m) items.push({ n: m[1], q: m[2], rest: [] })
    else if (line.trim()) {
      if (!items.length) continue // intro text before the first question is not expected; ignore blank
      items[items.length - 1].rest.push(line.trim())
    }
  }
  if (!items.length) throw new ContentError(file, `${idPrefix}: quiz has no numbered bold questions.`)

  return items.map(({ n, q, rest }) => {
    const where = `${idPrefix} question ${n}`
    const body = rest.join(' ')
    const arrow = body.indexOf('→')
    if (arrow < 0) throw new ContentError(file, `${where}: no "→ **(x).**" answer marker.`)
    const optionsPart = body.slice(0, arrow)
    const answerPart = body.slice(arrow + 1).trim()

    const markers = [...optionsPart.matchAll(/\(([a-z])\)\s+/g)]
    if (markers.length < 2) throw new ContentError(file, `${where}: found ${markers.length} options; expected at least 2.`)
    markers.forEach((m, i) => {
      if (m[1] !== String.fromCharCode(97 + i)) throw new ContentError(file, `${where}: options are not in a, b, c… order.`)
    })
    const options = markers.map((m, i) => {
      const start = (m.index ?? 0) + m[0].length
      const end = i + 1 < markers.length ? markers[i + 1].index : optionsPart.length
      return optionsPart.slice(start, end).trim()
    })

    const ans = /^\*\*\(([a-z])\)\.\*\*\s*(.*)$/.exec(answerPart)
    if (!ans) throw new ContentError(file, `${where}: cannot read the answer "${answerPart.slice(0, 40)}".`)
    const correctIndex = ans[1].charCodeAt(0) - 97
    if (correctIndex >= options.length) throw new ContentError(file, `${where}: answer (${ans[1]}) is not one of the options.`)

    return {
      id: `${idPrefix}-q${n}`,
      questionHtml: mdInline(q),
      optionsHtml: options.map(mdInline),
      correctIndex,
      explanationHtml: ans[2] ? mdInline(ans[2]) : '',
    }
  })
}

// ---------- Exercises ----------

const ANSWER_MARKER = /^\*\*(Answer key|Model answers?|Model plan)\b/
const LABEL_LINE = /^\*\(.+\)\*\s*$/

export function parseExercise(file: string, id: string, title: string, lines: string[]): Block {
  const at = lines.findIndex((l) => ANSWER_MARKER.test(l.trim()))
  if (at < 0) throw new ContentError(file, `${id} "${title}": no **Answer key**, **Model answer(s)** or **Model plan**.`)
  const prompt = trimBlock(lines.slice(0, at))
  const answerLines: string[] = []
  const labels: string[] = []
  for (const l of lines.slice(at)) {
    if (LABEL_LINE.test(l.trim())) labels.push(l.trim())
    else answerLines.push(l)
  }
  if (!prompt.length) throw new ContentError(file, `${id} "${title}": the prompt is empty.`)
  return {
    kind: 'exercise',
    id,
    title,
    promptHtml: mdToHtml(join(prompt)),
    answerHtml: mdToHtml(join(trimBlock(answerLines))),
    labelsHtml: labels.map(mdInline),
  }
}

// ---------- Research modules ----------

export interface ParsedModule {
  summary: ModuleSummary
  content: ModuleContent
}

export function parseResearchModule(file: string, src: string, moduleId: string, omissions: Omission[]): ParsedModule {
  const lines = normalise(src)
  const h1 = /^# Module (\d+): (.+?)\s*$/.exec(lines[0] ?? '')
  if (!h1) throw new ContentError(file, 'first line must be "# Module N: Title".')
  const { preamble, chunks } = splitHeadings(lines.slice(1), 2)

  const find = (pred: (t: string) => boolean, label: string) => {
    const c = chunks.find((ch) => pred(ch.title))
    if (!c) throw new ContentError(file, `missing heading "## ${label}".`)
    return c
  }

  const outcomes = find((t) => t === 'Module outcomes', 'Module outcomes')
  const outcomeItems = outcomes.lines.filter((l) => /^\d+\.\s/.test(l)).map((l) => mdInline(l.replace(/^\d+\.\s+/, '')))
  if (!outcomeItems.length) throw new ContentError(file, '"Module outcomes" has no numbered list.')
  const outcomesIntro = outcomes.lines.find((l) => l.trim() && !/^\d+\.\s/.test(l))?.trim()

  const mapChunk = find((t) => t === 'Lesson map', 'Lesson map')
  const lessonMap: LessonMapRow[] = parseTableRows(mapChunk.lines).map(([number, lesson, skill]) => ({
    number,
    lesson,
    skill,
  }))
  if (!lessonMap.length) throw new ContentError(file, '"Lesson map" table has no rows.')

  const lessonChunks = chunks.filter((c) => /^Lesson \d+:/.test(c.title))
  if (lessonChunks.length !== lessonMap.length)
    throw new ContentError(file, `lesson map lists ${lessonMap.length} lessons but found ${lessonChunks.length} "## Lesson N:" headings.`)

  const lessons: Lesson[] = lessonChunks.map((c, i) => {
    const m = /^Lesson (\d+): (.+)$/.exec(c.title)!
    const number = Number(m[1])
    if (number !== i + 1) throw new ContentError(file, `expected Lesson ${i + 1}, found Lesson ${number}.`)
    const lessonId = `l${number}`
    const prefix = `${moduleId}-${lessonId}`
    const { preamble: lp, chunks: subs } = splitHeadings(c.lines, 3)
    const blocks: Block[] = []
    if (lp.length) blocks.push({ kind: 'section', id: `${prefix}-intro`, title: '', html: mdToHtml(join(lp)) })
    for (const s of subs) {
      const bid = `${prefix}-${slug(s.title.split(':')[0])}`
      if (/^Self-assessment rubric/i.test(s.title)) {
        omissions.push({ file, what: `Lesson ${number}, "${s.title}" omitted (no self-assessment features).` })
        continue
      }
      if (/^Exercise\b/.test(s.title)) blocks.push(parseExercise(file, bid, s.title, s.lines))
      else if (/^Quiz\b/.test(s.title)) blocks.push({ kind: 'quiz', id: `${prefix}-quiz`, title: s.title, items: parseQuiz(file, `${prefix}-quiz`, s.lines) })
      else if (/^(Practice|Reflect)\b/.test(s.title)) blocks.push({ kind: 'practice', id: bid, title: s.title, html: mdToHtml(join(s.lines)) })
      else if (/^Final checklist/.test(s.title)) {
        omissions.push({ file, what: `Lesson ${number}, "${s.title}" rendered as a plain list (not tickable).` })
        const plain = s.lines.map((l) => l.replace(/^(\s*-\s+)\[[ xX]\]\s+/, '$1'))
        blocks.push({ kind: 'section', id: bid, title: s.title, html: mdToHtml(join(plain)) })
      } else blocks.push({ kind: 'section', id: bid, title: s.title, html: mdToHtml(join(s.lines)) })
    }
    if (!blocks.length) throw new ContentError(file, `Lesson ${number} has no content.`)
    return { id: lessonId, number, title: m[2], blocks }
  })

  const notes = chunks.find((c) => c.title === 'Notes for the app build')
  if (notes) omissions.push({ file, what: '"Notes for the app build" not rendered (instructions for the build).' })

  const reading = find((t) => /^(Sources and further reading|Further reading)\b/.test(t), 'Further reading / Sources and further reading')
  const readingHeading = reading.title.replace(/\s*\(.*\)\s*$/, '')

  const known = new Set([outcomes, mapChunk, notes, reading, ...lessonChunks])
  for (const c of chunks) if (!known.has(c)) throw new ContentError(file, `unexpected heading "## ${c.title}".`)

  return {
    summary: {
      id: moduleId,
      trackId: 'research',
      number: Number(h1[1]),
      title: h1[2],
      metaHtml: linesAsParagraphs(preamble),
      outcomesIntro,
      outcomesHtml: outcomeItems,
      lessonMap,
      pages: lessons.map((l) => ({ id: l.id, title: l.title, number: l.number })),
      quizCount: lessons.flatMap((l) => l.blocks).reduce((n, b) => n + (b.kind === 'quiz' ? b.items.length : 0), 0),
      furtherReading: parseFurtherReading(file, readingHeading, reading.lines),
    },
    content: { id: moduleId, lessons },
  }
}

// ---------- Communicative track ----------

const COMM_ORDER: { kind: CommSectionKind | 'reading'; prefix: string }[] = [
  { kind: 'why', prefix: 'Why it matters' },
  { kind: 'core', prefix: 'Core ideas' },
  { kind: 'language', prefix: 'Useful language' },
  { kind: 'example', prefix: 'Worked example' },
  { kind: 'marathi', prefix: 'Marathi to English notes' },
  { kind: 'try', prefix: 'Try it' },
  { kind: 'reading', prefix: 'Further reading' },
]

export interface ParsedCommTrack {
  title: string
  introHtml: string[]
  modules: ParsedModule[]
}

export function parseCommTrack(file: string, src: string, omissions: Omission[]): ParsedCommTrack {
  const lines = normalise(src)
  const h1 = /^# (.+?)(?::\s*Track Content)?\s*$/.exec(lines[0] ?? '')
  if (!h1) throw new ContentError(file, 'first line must be a "# " title.')
  const { preamble, chunks } = splitHeadings(lines.slice(1), 2)

  const quoted = preamble.filter((l) => l.startsWith('>'))
  if (!quoted.some((l) => /Build notes for Claude Code/.test(l)))
    throw new ContentError(file, 'expected a "> Build notes for Claude Code" blockquote in the header.')
  omissions.push({ file, what: 'Header "Build notes for Claude Code" blockquote not rendered (instructions for the build).' })
  const intro = preamble.filter((l) => !l.startsWith('>'))

  const modules = chunks.map((c, i): ParsedModule => {
    const m = /^Module (\d+): (.+)$/.exec(c.title)
    if (!m) throw new ContentError(file, `unexpected heading "## ${c.title}"; expected "## Module N: Title".`)
    const number = Number(m[1])
    if (number !== i + 1) throw new ContentError(file, `expected Module ${i + 1}, found Module ${number}.`)
    const moduleId = `c${number}`
    const { preamble: mp, chunks: subs } = splitHeadings(c.lines, 3)
    if (mp.length) throw new ContentError(file, `Module ${number}: text before the first "###" section.`)
    if (subs.length !== COMM_ORDER.length)
      throw new ContentError(file, `Module ${number}: found ${subs.length} sections; expected ${COMM_ORDER.length} (${COMM_ORDER.map((o) => o.prefix).join(' → ')}).`)

    const sections: CommSection[] = []
    let reading: FurtherReading | undefined
    subs.forEach((s, j) => {
      const want = COMM_ORDER[j]
      if (!s.title.startsWith(want.prefix))
        throw new ContentError(file, `Module ${number}: section ${j + 1} is "${s.title}"; expected "${want.prefix}…".`)
      if (want.kind === 'reading') {
        reading = parseFurtherReading(file, want.prefix, s.lines)
      } else {
        sections.push({ id: want.kind, title: s.title, html: mdToHtml(join(s.lines)) })
      }
    })

    return {
      summary: {
        id: moduleId,
        trackId: 'communicative',
        number,
        title: m[2],
        metaHtml: [],
        outcomesHtml: [],
        lessonMap: [],
        pages: sections.map((s) => ({ id: s.id, title: s.title })),
        quizCount: 0,
        furtherReading: reading!,
      },
      content: { id: moduleId, sections },
    }
  })
  if (!modules.length) throw new ContentError(file, 'no "## Module N:" sections.')

  return { title: h1[1], introHtml: linesAsParagraphs(intro), modules }
}

// ---------- Whole catalogue ----------

export interface SourceFiles {
  module1: string
  module2: string
  communication: string
}

export const FILES = {
  module1: 'module-1-academic-writing.md',
  module2: 'module-2-research-finding-reading.md',
  communication: 'communication-track.md',
} as const

export function parseAll(src: SourceFiles) {
  const omissions: Omission[] = []
  const r1 = parseResearchModule(FILES.module1, src.module1, 'r1', omissions)
  const r2 = parseResearchModule(FILES.module2, src.module2, 'r2', omissions)
  const comm = parseCommTrack(FILES.communication, src.communication, omissions)

  const trackLine = /\*\*Track:\*\*\s*([^(\n]+)/.exec(src.module2)
  if (!trackLine) throw new ContentError(FILES.module2, 'missing "**Track:**" line.')

  const tracks: Track[] = [
    { id: 'research', title: trackLine[1].trim(), introHtml: [], modules: [r1.summary, r2.summary] },
    { id: 'communicative', title: comm.title, introHtml: comm.introHtml, modules: comm.modules.map((m) => m.summary) },
  ]
  const contents = [r1, r2, ...comm.modules].map((m) => m.content)
  return { catalog: { tracks }, contents, omissions }
}
