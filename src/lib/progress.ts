// Progress is "visited" only: no scores. A module is complete when every page in it has been visited.
import type { ModuleSummary, Track } from '../types/content'
import { pageKey } from './content'

export interface ModuleProgress {
  visited: number
  total: number
  /** 0–100, for the progress line only. */
  pct: number
  complete: boolean
  started: boolean
}

export function moduleProgress(m: ModuleSummary, visited: Set<string>): ModuleProgress {
  const total = m.pages.length
  const n = m.pages.filter((p) => visited.has(pageKey(m.id, p.id))).length
  return { visited: n, total, pct: total ? Math.round((n / total) * 100) : 0, complete: total > 0 && n === total, started: n > 0 }
}

export function trackProgress(t: Track, visited: Set<string>) {
  const done = t.modules.filter((m) => moduleProgress(m, visited).complete).length
  return { done, total: t.modules.length }
}

/** The module to continue: the first started-but-unfinished, else the first not complete, else the first. */
export function currentModule(t: Track, visited: Set<string>): ModuleSummary {
  return (
    t.modules.find((m) => {
      const p = moduleProgress(m, visited)
      return p.started && !p.complete
    }) ??
    t.modules.find((m) => !moduleProgress(m, visited).complete) ??
    t.modules[0]
  )
}

/** Plain status text that carries the meaning the progress line shows. */
export function statusText(m: ModuleSummary, p: ModuleProgress): string {
  if (p.complete) return 'Completed'
  if (!p.started) return 'Not started'
  const unit = m.trackId === 'research' ? 'lessons' : 'sections'
  return `${p.visited} of ${p.total} ${unit} read`
}
