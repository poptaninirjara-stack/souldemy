import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { countContent } from './counts.ts'
import { ContentError, FILES, parseAll, parseExercise, parseQuiz } from './parse.ts'

const dir = join(__dirname, '..', '..', 'content')
const src = {
  module1: readFileSync(join(dir, FILES.module1), 'utf8'),
  module2: readFileSync(join(dir, FILES.module2), 'utf8'),
  communication: readFileSync(join(dir, FILES.communication), 'utf8'),
}

describe('parseAll on the real content files', () => {
  const { catalog, contents, omissions } = parseAll(src)
  const counts = Object.fromEntries(countContent(catalog, contents).map((c) => [c.module.split(' ')[0], c]))

  it('finds both tracks and six modules', () => {
    expect(catalog.tracks.map((t) => t.id)).toEqual(['research', 'communicative'])
    expect(catalog.tracks[0].modules.map((m) => m.id)).toEqual(['r1', 'r2'])
    expect(catalog.tracks[1].modules.map((m) => m.id)).toEqual(['c1', 'c2', 'c3', 'c4'])
  })

  it('counts lessons, exercises, quiz items and links per module', () => {
    expect(counts.r1).toMatchObject({ lessonsOrSections: 7, exercises: 8, quizItems: 8, links: 8 })
    expect(counts.r2).toMatchObject({ lessonsOrSections: 7, exercises: 8, quizItems: 8, links: 13 })
    expect(counts.c1).toMatchObject({ lessonsOrSections: 6, exercises: 0, quizItems: 0, links: 4 })
    expect(counts.c2).toMatchObject({ lessonsOrSections: 6, links: 3 })
    expect(counts.c3).toMatchObject({ lessonsOrSections: 6, links: 7 })
    expect(counts.c4).toMatchObject({ lessonsOrSections: 6, links: 6 })
  })

  it('reads module outcomes and lesson maps', () => {
    const [r1, r2] = catalog.tracks[0].modules
    expect(r1.outcomesHtml).toHaveLength(5)
    expect(r2.outcomesHtml).toHaveLength(7)
    expect(r1.lessonMap).toHaveLength(7)
    expect(r1.lessonMap[6].skill).toBe('Quiz, practice answer, self-assessment') // raw; trimmed at render time
  })

  it('omits the self-assessment rubric and build notes, and un-ticks the checklist', () => {
    const r1 = contents.find((c) => c.id === 'r1')!
    const l7 = r1.lessons![6]
    expect(l7.blocks.map((b) => b.title)).not.toContain('Self-assessment rubric')
    const json = JSON.stringify(contents)
    expect(json).not.toMatch(/Notes for the app build|Build notes for Claude Code|<input/)
    const checklist = r1.lessons![5].blocks.find((b) => b.title === 'Final checklist')
    expect(checklist && 'html' in checklist && checklist.html).not.toContain('[ ]')
    expect(omissions.length).toBeGreaterThanOrEqual(5)
  })

  it('keeps "invented for practice" style labels visible and out of the hidden answer', () => {
    const r1 = contents.find((c) => c.id === 'r1')!
    const ex1 = r1.lessons![0].blocks.find((b) => b.kind === 'exercise')!
    if (ex1.kind !== 'exercise') throw new Error()
    expect(ex1.labelsHtml[0]).toContain('invented for practice')
    expect(ex1.answerHtml).not.toContain('invented for practice')
    expect(ex1.promptHtml).toContain('(Rao, 2019)')

    const r2 = contents.find((c) => c.id === 'r2')!
    const ex6 = r2.lessons![4].blocks.find((b) => b.kind === 'exercise')!
    if (ex6.kind !== 'exercise') throw new Error()
    expect(ex6.promptHtml).toContain('Abstract invented for practice.')
  })

  it('parses quiz options on one line and on separate lines', () => {
    const r1 = contents.find((c) => c.id === 'r1')!
    const quiz = r1.lessons![6].blocks.find((b) => b.kind === 'quiz')!
    if (quiz.kind !== 'quiz') throw new Error()
    expect(quiz.items[0].optionsHtml).toEqual(['Describe', 'Evaluate', 'Outline', 'Illustrate'])
    expect(quiz.items[0].correctIndex).toBe(1)
    expect(quiz.items[1].optionsHtml).toHaveLength(4)
    expect(quiz.items[1].correctIndex).toBe(2)
    expect(quiz.items[3].explanationHtml).toBe('')
  })

  it('keeps both links in a two-link Further reading bullet', () => {
    const r2 = catalog.tracks[0].modules[1]
    const shodh = r2.furtherReading.items.find((i) => i.html.includes('Shodhganga brochure'))!
    expect(shodh.links.map((l) => l.title)).toEqual(['Shodhganga brochure', 'Shodhganga repository'])
    expect(r2.furtherReading.afterHtml).toContain('newly written')
  })

  it('makes every content link open in a new tab safely', () => {
    const html = JSON.stringify(catalog)
    const anchors = html.match(/<a [^>]*>/g) ?? []
    expect(anchors.length).toBeGreaterThan(0)
    for (const a of anchors) expect(a).toContain('rel=\\"noopener noreferrer\\"')
  })

  it('reads the seven communicative sections in order and marks Marathi text', () => {
    const c1 = contents.find((c) => c.id === 'c1')!
    expect(c1.sections!.map((s) => s.id)).toEqual(['why', 'core', 'language', 'example', 'marathi', 'try'])
    expect(c1.sections![4].html).toContain('<span lang="mr">मला एक शंका आहे</span>')
  })
})

describe('parser failures are loud', () => {
  it('rejects a quiz item with no answer', () => {
    expect(() => parseQuiz('x.md', 'q', ['1. **Question?**', '   (a) one (b) two'])).toThrow(ContentError)
  })
  it('rejects an exercise with no answer key', () => {
    expect(() => parseExercise('x.md', 'e', 'Exercise 9', ['Do something.'])).toThrow(/Answer key/)
  })
  it('rejects a module that is missing its lesson map', () => {
    const broken = src.module1.replace('## Lesson map', '## Lesson plan')
    expect(() => parseAll({ ...src, module1: broken })).toThrow(/Lesson map/)
  })
  it('rejects communicative sections out of order', () => {
    const broken = src.communication.replace('### Core ideas', '### Try it first')
    expect(() => parseAll({ ...src, communication: broken })).toThrow(/expected "Core ideas/)
  })
})
