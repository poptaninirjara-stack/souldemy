// Signed-in progress sync. localStorage stays the working copy (so the app is instant and
// works offline); each saved key is also uploaded to the `progress` table, one row per key.
//
// Rules when the device and the account disagree:
// - A key changed on this device but not uploaded yet ("pending") keeps the device copy.
// - On the very first sign-in on a device, anything done before signing in is merged
//   into the account (lists are combined, nothing is thrown away).
// - Otherwise the account copy wins, so another device's work shows up here.
import { clearAll, load, onSave, remove, save } from './storage'
import { supabase } from './supabase'

/** Storage keys that follow the student between devices. ('ui' and 'schema' stay per device.) */
export const SYNC_KEYS = ['visited', 'lastLocation', 'attempts', 'quiz', 'xp', 'deck', 'games', 'goal', 'seen'] as const
const isSyncKey = (k: string) => (SYNC_KEYS as readonly string[]).includes(k)

const PENDING = 'sync:pending'
const OWNER = 'sync:owner'
const PUSH_DELAY_MS = 1500

export type SyncStatus = 'idle' | 'saving' | 'saved' | 'offline'

type Row = { key: string; value: unknown }
const isObject = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v)
const isStringArray = (v: unknown): v is string[] => Array.isArray(v) && v.every((x) => typeof x === 'string')

/** Combine a device value with an account value without losing either (first sign-in only). */
export function combine(device: unknown, account: unknown): unknown {
  if (device === undefined || device === null) return account
  if (account === undefined || account === null) return device
  if (Array.isArray(device) && Array.isArray(account)) {
    const out = [...account]
    for (const x of device) if (!out.some((y) => JSON.stringify(y) === JSON.stringify(x))) out.push(x)
    return out
  }
  if (isObject(device) && isObject(account)) {
    const out: Record<string, unknown> = { ...device }
    for (const [k, v] of Object.entries(account)) out[k] = k in device ? combine(device[k], v) : v
    return out
  }
  if (typeof device === 'boolean' && typeof account === 'boolean') return device || account
  if (typeof device === 'number' && typeof account === 'number') return Math.max(device, account)
  // Text and anything else: keep the longer answer, which is usually the more complete one.
  if (typeof device === 'string' && typeof account === 'string') return device.length >= account.length ? device : account
  return account
}

/** What the device should hold for one key after a pull. */
export function resolve(device: unknown, account: unknown, opts: { pending: boolean; firstSignIn: boolean }): unknown {
  if (opts.pending && device !== undefined) return device
  if (opts.firstSignIn) return combine(device, account)
  return account === undefined ? device : account
}

const pendingKeys = () => new Set(load<string[]>(PENDING, [], isStringArray))
const setPending = (keys: Set<string>) => (keys.size ? save(PENDING, [...keys]) : remove(PENDING))
const deviceValue = (key: string) => load<unknown>(key, undefined)

let userId: string | null = null
let timer: ReturnType<typeof setTimeout> | undefined
let unsubscribe: (() => void) | undefined
let status: SyncStatus = 'idle'
const statusListeners = new Set<(s: SyncStatus) => void>()

function setStatus(s: SyncStatus) {
  status = s
  for (const l of statusListeners) l(s)
}

export function syncStatus(): SyncStatus {
  return status
}

export function onSyncStatus(l: (s: SyncStatus) => void): () => void {
  statusListeners.add(l)
  return () => statusListeners.delete(l)
}

/** Upload every pending key now. Safe to call often; does nothing when signed out. */
export async function flush(): Promise<void> {
  clearTimeout(timer)
  if (!supabase || !userId) return
  const keys = pendingKeys()
  if (!keys.size) return
  const uid = userId
  const rows = [...keys].map((key) => ({ user_id: uid, key, value: deviceValue(key) ?? null, updated_at: new Date().toISOString() }))
  setStatus('saving')
  const { error } = await supabase.from('progress').upsert(rows)
  if (error) {
    setStatus('offline')
    timer = setTimeout(() => void flush(), 15000)
    return
  }
  // Keys saved again while uploading stay pending for the next round.
  const now = pendingKeys()
  for (const r of rows) if (JSON.stringify(deviceValue(r.key) ?? null) === JSON.stringify(r.value)) now.delete(r.key)
  setPending(now)
  setStatus(now.size ? 'saving' : 'saved')
  if (now.size) timer = setTimeout(() => void flush(), PUSH_DELAY_MS)
}

function listen() {
  unsubscribe?.()
  unsubscribe = onSave((key) => {
    if (!userId || !isSyncKey(key)) return
    const keys = pendingKeys()
    keys.add(key)
    setPending(keys)
    setStatus('saving')
    clearTimeout(timer)
    timer = setTimeout(() => void flush(), PUSH_DELAY_MS)
  })
}

/**
 * Start syncing for a signed-in user: download their progress, merge it into the device,
 * upload anything the account is missing, then keep uploading changes.
 * Returns true when the device data changed (the app should re-read its state).
 */
export async function startSync(uid: string): Promise<boolean> {
  if (!supabase) return false
  const owner = load<string | null>(OWNER, null)
  if (owner && owner !== uid) {
    // Someone else's progress is still on this device (they never signed out): drop it.
    clearAll()
  }
  const firstSignIn = owner !== uid
  userId = uid
  listen()

  const { data, error } = await supabase.from('progress').select('key, value').eq('user_id', uid)
  if (error) {
    setStatus('offline')
    return owner !== null && owner !== uid
  }
  const account = new Map((data as Row[]).map((r) => [r.key, r.value]))
  const pending = pendingKeys()
  let changed = owner !== null && owner !== uid
  const upload = new Set(pending)

  for (const key of SYNC_KEYS) {
    const device = deviceValue(key)
    const next = resolve(device, account.get(key), { pending: pending.has(key), firstSignIn })
    if (next === undefined) continue
    if (JSON.stringify(next) !== JSON.stringify(device)) {
      save(key, next)
      changed = true
    }
    if (JSON.stringify(next) !== JSON.stringify(account.get(key))) upload.add(key)
  }
  save(OWNER, uid)
  setPending(upload)
  await flush()
  if (!upload.size) setStatus('saved')
  return changed
}

/** Stop syncing and remove this user's progress from the device (shared computers). */
export async function stopSync(): Promise<void> {
  await flush()
  unsubscribe?.()
  unsubscribe = undefined
  clearTimeout(timer)
  userId = null
  clearAll()
  setStatus('idle')
}

/** "Reset my data" while signed in: also delete the account copy. */
export async function deleteAccountProgress(): Promise<void> {
  if (!supabase || !userId) return
  clearTimeout(timer)
  remove(PENDING)
  await supabase.from('progress').delete().eq('user_id', userId)
}

export const isSyncing = () => userId !== null
