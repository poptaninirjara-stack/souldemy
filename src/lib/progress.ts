// Reading progress within a module ("visited" pages). The full place progress, which also
// counts games, lives in lib/gamify.ts.
import type { ModuleSummary } from '../types/content'
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
