// Shape of the JSON produced by scripts/build-content.ts.
// All *Html fields are sanitised at build time (rehype-sanitize).

export type TrackId = 'research' | 'communicative'

export interface Link {
  title: string
  url: string
}

/** One bullet from a Further reading list. `html` is the bullet rendered verbatim. */
export interface ReadingItem {
  html: string
  links: Link[]
  /** Plain text before the first link, e.g. "Purdue OWL". */
  source: string
  /** Plain text after the last link, without the leading colon. */
  note?: string
}

export interface FurtherReading {
  heading: string
  items: ReadingItem[]
  /** Any paragraph that follows the list (e.g. "All explanations … newly written"). */
  afterHtml?: string
}

export interface LessonMapRow {
  number: string
  lesson: string
  skill: string
}

export interface PageRef {
  id: string
  title: string
  /** Lesson number for research modules. */
  number?: number
}

export interface QuizItem {
  id: string
  questionHtml: string
  optionsHtml: string[]
  correctIndex: number
  /** May be empty: some items give only the letter. */
  explanationHtml: string
}

export type Block =
  | { kind: 'section'; id: string; title: string; html: string }
  | {
      kind: 'exercise'
      id: string
      title: string
      promptHtml: string
      /** Hidden until the student has attempted. */
      answerHtml: string
      /** Italic labels such as "(invented for practice)" found next to the answer; always visible. */
      labelsHtml: string[]
    }
  | { kind: 'practice'; id: string; title: string; html: string }
  | { kind: 'quiz'; id: string; title: string; items: QuizItem[] }

export interface Lesson {
  id: string
  number: number
  title: string
  blocks: Block[]
}

export type CommSectionKind = 'why' | 'core' | 'language' | 'example' | 'marathi' | 'try'

export interface CommSection {
  id: CommSectionKind
  title: string
  html: string
}

export interface ModuleSummary {
  id: string
  trackId: TrackId
  number: number
  title: string
  /** Metadata lines under the module title, one paragraph each. */
  metaHtml: string[]
  outcomesIntro?: string
  outcomesHtml: string[]
  lessonMap: LessonMapRow[]
  pages: PageRef[]
  /** Number of self-correcting quiz items in the module (0 for the communicative track). */
  quizCount: number
  furtherReading: FurtherReading
}

export interface ModuleContent {
  id: string
  lessons?: Lesson[]
  sections?: CommSection[]
}

export interface Track {
  id: TrackId
  title: string
  introHtml: string[]
  modules: ModuleSummary[]
}

export interface Catalog {
  tracks: Track[]
}
