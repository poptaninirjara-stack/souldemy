import { afterEach, describe, expect, it, vi } from 'vitest'
import { clearAll, isPersistent, load, resetStorageProbe, save } from './storage'

afterEach(() => {
  vi.restoreAllMocks()
  resetStorageProbe()
})

describe('storage', () => {
  it('round-trips namespaced values', () => {
    save('visited', ['r1/l1'])
    expect(localStorage.getItem('souldemy:v1:visited')).toBe('["r1/l1"]')
    expect(load('visited', [])).toEqual(['r1/l1'])
  })

  it('falls back to the default for corrupt or invalid data', () => {
    localStorage.setItem('souldemy:v1:visited', '{not json')
    expect(load('visited', ['x'])).toEqual(['x'])
    localStorage.setItem('souldemy:v1:visited', '42')
    expect(load('visited', [] as string[], Array.isArray)).toEqual([])
  })

  it('keeps working in memory when localStorage throws', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    resetStorageProbe()
    expect(isPersistent()).toBe(false)
    save('track', 'research')
    expect(load('track', null)).toBe('research')
  })

  it('clears only this app’s keys', () => {
    localStorage.setItem('someone-else', '1')
    save('track', 'research')
    clearAll()
    expect(localStorage.getItem('souldemy:v1:track')).toBeNull()
    expect(localStorage.getItem('someone-else')).toBe('1')
  })
})
