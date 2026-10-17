// Practice-game content (content/games.json) and phrase cards (extracted from the lessons).
// `d: true` marks text drafted for the games rather than taken from the author's content;
// every drafted line is listed for the author's review.

/** A phrase card, extracted verbatim from a "Useful language" or task-word table. */
export interface Phrase {
  id: string
  moduleId: string
  /** What the phrase is for: the table's Purpose / "What to do" column. */
  prompt: string
  /** The phrase itself. */
  answer: string
  kind: 'phrase' | 'taskword'
}

interface GameBase {
  id: string
  /** Module the game belongs to (its campus place). */
  moduleId: string
  /** Lesson or section it practises, for "Practise this" links. */
  after?: string
  title: string
  /** One-line instruction shown before the first item. */
  intro: string
  /** Where the items come from, shown to students. */
  source: string
}

export interface SortItem {
  text: string
  bin: string
  why: string
  d?: boolean
}

export interface SortGame extends GameBase {
  kind: 'sort'
  bins: { id: string; label: string }[]
  items: SortItem[]
}

export interface PickItem {
  prompt: string
  options: string[]
  correct: number
  why: string
  d?: boolean
}

export interface PickGame extends GameBase {
  kind: 'pick'
  /** Shown above each prompt, e.g. "Which task word asks you to…". */
  ask: string
  items: PickItem[]
}

export interface ScenarioChoice {
  text: string
  good: boolean
  /** What happens next: the other person's reaction. */
  reply: string
  why: string
  d?: boolean
}

export interface ScenarioStep {
  /** Who is speaking or what is on screen. */
  from: string
  message: string
  ask: string
  choices: ScenarioChoice[]
}

export interface ScenarioGame extends GameBase {
  kind: 'scenario'
  /** e.g. "Inbox" or "Interview". */
  setting: string
  steps: ScenarioStep[]
  ending: string
}

export type Game = SortGame | PickGame | ScenarioGame

export interface MirrorTask {
  moduleId: string
  /** The author's own "Try it" task, verbatim. */
  task: string
  checklist: string[]
  /** Suggested length in seconds (guidance only; there is no countdown). */
  seconds: number
}

export interface GameBundle {
  games: Game[]
  mirror: MirrorTask[]
  phrases: Phrase[]
}
