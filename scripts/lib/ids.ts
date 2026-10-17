// Every ID that students' saved progress points at: modules, pages, exercises, quiz
// items, games and phrase cards. Progress is stored against these, so an ID that
// disappears between two publishes means students lose that part of their progress.
// Most IDs come from headings (see parse.ts), so renaming a heading changes its ID.
import type { Catalog, ModuleContent } from '../../src/types/content.ts'
import type { GameBundle } from '../../src/types/game.ts'

export function progressIds(catalog: Catalog, contents: ModuleContent[], games: GameBundle): string[] {
  const ids = new Set<string>()
  for (const t of catalog.tracks)
    for (const m of t.modules) {
      ids.add(`module:${m.id}`)
      for (const p of m.pages) ids.add(`page:${m.id}/${p.id}`)
    }
  for (const c of contents)
    for (const l of c.lessons ?? [])
      for (const b of l.blocks) {
        if (b.kind === 'exercise' || b.kind === 'practice') ids.add(`exercise:${b.id}`)
        if (b.kind === 'quiz') for (const q of b.items) ids.add(`quiz:${q.id}`)
      }
  for (const g of games.games) ids.add(`game:${g.id}`)
  for (const p of games.phrases) ids.add(`phrase:${p.id}`)
  return [...ids].sort()
}
