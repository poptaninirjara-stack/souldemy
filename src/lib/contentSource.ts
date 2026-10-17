// Where lessons come from. The build bundles the content in /content, so the app always
// works offline. When a newer version has been published to Supabase
// (npm run publish-content, or the GitHub Action on every push), the app downloads it in the
// background, keeps it on the device, and uses it from the next start.
import bundledCatalog from '../content/catalog.json'
import bundledGames from '../content/games.json'
import meta from '../content/meta.json'
import type { Catalog, ModuleContent } from '../types/content'
import type { GameBundle } from '../types/game'
import { supabase } from './supabase'

// Outside the progress namespace, so "Reset my data" and signing out keep it.
const CACHE_KEY = 'souldemy:content'

interface Published {
  versionId: number
  hash: string
  publishedAt: string
  catalog: Catalog
  games: GameBundle
  modules: Record<string, ModuleContent>
}

function readCache(): Published | null {
  try {
    const raw = window.localStorage.getItem(CACHE_KEY)
    const v = raw ? (JSON.parse(raw) as Published) : null
    return v && typeof v.hash === 'string' && v.catalog && v.games && v.modules ? v : null
  } catch {
    return null
  }
}

function writeCache(p: Published | null) {
  try {
    if (p) window.localStorage.setItem(CACHE_KEY, JSON.stringify(p))
    else window.localStorage.removeItem(CACHE_KEY)
  } catch {
    // Storage full or blocked: keep using the bundled content.
  }
}

// Use the downloaded copy only when it differs from, and was published after, the bundled one.
const cached = readCache()
const active = cached && cached.hash !== meta.hash && cached.publishedAt > meta.builtAt ? cached : null

export const source = {
  catalog: (active?.catalog ?? bundledCatalog) as Catalog,
  games: (active?.games ?? bundledGames) as GameBundle,
  /** The published copy of one module, or undefined to use the bundled chunk. */
  module: (id: string): ModuleContent | undefined => active?.modules[id],
  hash: active?.hash ?? meta.hash,
}

/**
 * Ask Supabase for the newest published version. Downloads it when it is new.
 * Returns true when the next start will show different content.
 */
export async function checkForContentUpdate(): Promise<boolean> {
  if (!supabase) return false
  const { data: latest, error } = await supabase
    .from('content_versions')
    .select('id, hash, published_at')
    .order('id', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) return false
  if (!latest || latest.hash === meta.hash) {
    // Nothing published, or the bundled content is already the newest: drop any old copy.
    if (cached) writeCache(null)
    return !!active
  }
  if (latest.hash === source.hash) return false
  if (cached?.hash === latest.hash) return false

  const [{ data: version, error: vErr }, { data: modules, error: mErr }] = await Promise.all([
    supabase.from('content_versions').select('catalog, games').eq('id', latest.id).single(),
    supabase.from('content_modules').select('module_id, data').eq('version_id', latest.id),
  ])
  if (vErr || mErr || !version || !modules) return false
  writeCache({
    versionId: latest.id,
    hash: latest.hash,
    publishedAt: new Date(latest.published_at).toISOString(),
    catalog: version.catalog,
    games: version.games,
    modules: Object.fromEntries(modules.map((m) => [m.module_id, m.data])),
  })
  return true
}
