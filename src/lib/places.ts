// Campus places: each module is a place on the campus map ("Campus to Career").
export interface Place {
  moduleId: string
  name: string
  /** Token name for the tile colour (ink text sits on all of these). */
  tone: 'mango' | 'sky' | 'lilac' | 'mint' | 'vermilion' | 'wash'
  /** One line on what you get here. */
  tagline: string
  wing: 'study' | 'career'
}

export const PLACES: Place[] = [
  { moduleId: 'r1', name: 'Exam Hall', tone: 'mango', tagline: 'Decode questions and write answers examiners reward.', wing: 'study' },
  { moduleId: 'r2', name: 'Library', tone: 'sky', tagline: 'Find, read and judge scholarly sources.', wing: 'study' },
  { moduleId: 'c1', name: 'Seminar Room', tone: 'lilac', tagline: 'Speak with structure and handle questions.', wing: 'career' },
  { moduleId: 'c2', name: 'Email Desk', tone: 'mint', tagline: 'Write emails that get a reply.', wing: 'career' },
  { moduleId: 'c3', name: 'CV Desk', tone: 'vermilion', tagline: 'Turn what you did into lines recruiters read.', wing: 'career' },
  { moduleId: 'c4', name: 'Interview Room', tone: 'wash', tagline: 'Answer clearly, with a story ready.', wing: 'career' },
]

export const WINGS = {
  study: { name: 'Study wing', line: 'Research-Oriented English for Humanities' },
  career: { name: 'Career wing', line: 'Communicative / Professional English' },
} as const

export const placeFor = (moduleId: string) => PLACES.find((p) => p.moduleId === moduleId)
