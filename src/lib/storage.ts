// Small storage seam: load / save / remove / migrate. Every access is wrapped so the app
// keeps working (in memory) when localStorage is blocked, full or missing.
// Accounts and sync can later replace this module without touching screens.
import { STORAGE_NAMESPACE } from '../config'

export const SCHEMA_VERSION = 1

const memory = new Map<string, string>()

function local(): Storage | null {
  try {
    const s = window.localStorage
    const probe = `${STORAGE_NAMESPACE}__probe`
    s.setItem(probe, '1')
    s.removeItem(probe)
    return s
  } catch {
    return null
  }
}

let cached: Storage | null | undefined
function store(): Storage | null {
  if (cached === undefined) cached = local()
  return cached
}

/** True when progress will survive a reload. */
export function isPersistent(): boolean {
  return store() !== null
}

export function load<T>(key: string, fallback: T, isValid: (v: unknown) => boolean = () => true): T {
  const k = STORAGE_NAMESPACE + key
  let raw: string | null = null
  const s = store()
  try {
    raw = s ? s.getItem(k) : (memory.get(k) ?? null)
  } catch {
    raw = memory.get(k) ?? null
  }
  if (raw === null) return fallback
  try {
    const value: unknown = JSON.parse(raw)
    return isValid(value) ? (value as T) : fallback
  } catch {
    return fallback
  }
}

export function save(key: string, value: unknown): void {
  const k = STORAGE_NAMESPACE + key
  const raw = JSON.stringify(value)
  memory.set(k, raw)
  try {
    store()?.setItem(k, raw)
  } catch {
    // Quota exceeded or blocked: the in-memory copy keeps the session working.
  }
}

export function remove(key: string): void {
  const k = STORAGE_NAMESPACE + key
  memory.delete(k)
  try {
    store()?.removeItem(k)
  } catch {
    // ignore
  }
}

/** Remove every key this app owns. */
export function clearAll(): void {
  for (const k of [...memory.keys()]) if (k.startsWith(STORAGE_NAMESPACE)) memory.delete(k)
  try {
    const s = store()
    if (!s) return
    const mine: string[] = []
    for (let i = 0; i < s.length; i++) {
      const k = s.key(i)
      if (k?.startsWith(STORAGE_NAMESPACE)) mine.push(k)
    }
    mine.forEach((k) => s.removeItem(k))
  } catch {
    // ignore
  }
}

/**
 * Bring stored data up to SCHEMA_VERSION. v1 is the first schema, so there is nothing
 * to convert yet; later versions add steps here keyed by the stored version.
 */
export function migrate(): void {
  const stored = load<number>('schema', 0, (v) => typeof v === 'number')
  if (stored === SCHEMA_VERSION) return
  // if (stored === 1) { …convert v1 → v2… }
  save('schema', SCHEMA_VERSION)
}

/** Session-only flags (e.g. "opening seen"). */
export function sessionFlag(key: string): boolean {
  try {
    return window.sessionStorage.getItem(STORAGE_NAMESPACE + key) === '1'
  } catch {
    return memory.get('session:' + key) === '1'
  }
}

export function setSessionFlag(key: string): void {
  memory.set('session:' + key, '1')
  try {
    window.sessionStorage.setItem(STORAGE_NAMESPACE + key, '1')
  } catch {
    // ignore
  }
}

/** For tests: forget whether storage was available. */
export function resetStorageProbe(): void {
  cached = undefined
  memory.clear()
}
