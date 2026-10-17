// Access to the generated content. The catalogue (titles, outcomes, lesson maps, further
// reading) is small and bundled; each module's lessons are loaded on demand.
import catalogJson from '../content/catalog.json'
import type { Catalog, ModuleContent, ModuleSummary, Track, TrackId } from '../types/content'

export const catalog = catalogJson as Catalog

const loaders = import.meta.glob<{ default: ModuleContent }>('../content/modules/*.json')
const cache = new Map<string, ModuleContent>()

export async function loadModule(id: string): Promise<ModuleContent> {
  const hit = cache.get(id)
  if (hit) return hit
  const loader = loaders[`../content/modules/${id}.json`]
  if (!loader) throw new Error(`No content for module "${id}".`)
  const mod = (await loader()).default
  cache.set(id, mod)
  return mod
}

export function cachedModule(id: string): ModuleContent | undefined {
  return cache.get(id)
}

export function getTrack(id: string | undefined): Track | undefined {
  return catalog.tracks.find((t) => t.id === id)
}

export function getModule(trackId: string | undefined, moduleId: string | undefined): ModuleSummary | undefined {
  return getTrack(trackId)?.modules.find((m) => m.id === moduleId)
}

export function findModule(moduleId: string): ModuleSummary | undefined {
  for (const t of catalog.tracks) {
    const m = t.modules.find((x) => x.id === moduleId)
    if (m) return m
  }
  return undefined
}

export const pageKey = (moduleId: string, pageId: string) => `${moduleId}/${pageId}`

export const isTrackId = (v: unknown): v is TrackId => v === 'research' || v === 'communicative'

/** Short labels used in navigation and filters. */
export const TRACK_SHORT: Record<TrackId, string> = {
  research: 'Research-Oriented English',
  communicative: 'Communicative English',
}

export function modulePath(m: ModuleSummary): string {
  return `/${m.trackId}/${m.id}`
}

export function pagePath(m: ModuleSummary, pageId: string): string {
  return m.trackId === 'research' ? `/${m.trackId}/${m.id}/${pageId}` : `/${m.trackId}/${m.id}/read?s=${pageId}`
}

/** "purdue.edu" from a URL, for attributing a source by its host. */
export function hostOf(url: string): string {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, '')
  } catch {
    return url
  }
}
