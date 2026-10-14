import type { Catalog, ModuleContent } from '../../src/types/content.ts'

export interface ModuleCounts {
  module: string
  lessonsOrSections: number
  exercises: number
  quizItems: number
  links: number
}

export function countContent(catalog: Catalog, contents: ModuleContent[]): ModuleCounts[] {
  return catalog.tracks.flatMap((t) =>
    t.modules.map((m) => {
      const c = contents.find((x) => x.id === m.id)!
      const blocks = (c.lessons ?? []).flatMap((l) => l.blocks)
      return {
        module: `${m.id} ${m.title}`.slice(0, 48),
        lessonsOrSections: (c.lessons ?? c.sections ?? []).length,
        exercises: blocks.filter((b) => b.kind === 'exercise').length,
        quizItems: blocks.reduce((n, b) => n + (b.kind === 'quiz' ? b.items.length : 0), 0),
        links: m.furtherReading.items.reduce((n, i) => n + i.links.length, 0),
      }
    }),
  )
}
