// Access to the generated game bundle (src/content/games.json, built from content/games.json).
import gamesJson from '../content/games.json'
import type { Game, GameBundle, MirrorTask, Phrase } from '../types/game'

export const bundle = gamesJson as GameBundle

export const getGame = (id: string | undefined): Game | undefined => bundle.games.find((g) => g.id === id)
export const gamesFor = (moduleId: string): Game[] => bundle.games.filter((g) => g.moduleId === moduleId)
export const gamesAfter = (moduleId: string, pageId: string): Game[] =>
  bundle.games.filter((g) => g.moduleId === moduleId && g.after === pageId)
export const phrasesFor = (moduleId: string): Phrase[] => bundle.phrases.filter((p) => p.moduleId === moduleId)
export const mirrorFor = (moduleId: string): MirrorTask | undefined => bundle.mirror.find((m) => m.moduleId === moduleId)

/** Number of items a game round uses (sort and pick rounds draw a sample; scenarios use every step). */
export const ROUND_SIZE = 8

export const KIND_LABEL: Record<Game['kind'], string> = {
  sort: 'Sort it',
  pick: 'Quick pick',
  scenario: 'Story',
}
