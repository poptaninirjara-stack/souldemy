import { describe, expect, it } from 'vitest'
import { combine, resolve } from './sync'

describe('sync merge rules', () => {
  it('combines lists and records on first sign-in without losing either side', () => {
    expect(combine(['r1/l1', 'r1/l2'], ['r1/l2', 'c1/why'])).toEqual(['r1/l2', 'c1/why', 'r1/l1'])
    expect(
      combine(
        { 'ex-1': { text: 'my long draft answer', revealed: false } },
        { 'ex-1': { text: 'short', revealed: true }, 'ex-2': { text: 'b', revealed: false } },
      ),
    ).toEqual({ 'ex-1': { text: 'my long draft answer', revealed: true }, 'ex-2': { text: 'b', revealed: false } })
    expect(combine({ badges: ['a'], level: 2 }, { badges: ['b'], level: 3 })).toEqual({ badges: ['b', 'a'], level: 3 })
  })

  it('keeps unsent device changes, otherwise takes the account copy', () => {
    const device = { a: 1 }
    const account = { b: 2 }
    expect(resolve(device, account, { pending: true, firstSignIn: false })).toBe(device)
    expect(resolve(device, account, { pending: false, firstSignIn: false })).toBe(account)
    expect(resolve(device, undefined, { pending: false, firstSignIn: false })).toBe(device)
    expect(resolve(device, account, { pending: false, firstSignIn: true })).toEqual({ a: 1, b: 2 })
  })

  it('lets a cleared value win when it was changed on this device', () => {
    expect(resolve({}, { 'ex-1': { text: 'old', revealed: true } }, { pending: true, firstSignIn: false })).toEqual({})
  })
})
