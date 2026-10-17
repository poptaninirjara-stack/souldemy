import { describe, expect, it } from 'vitest'
import { parseCsv, parseCsvObjects } from './csv.ts'

describe('csv', () => {
  it('reads quoted fields, escaped quotes, CRLF and a BOM', () => {
    expect(parseCsv('﻿a,b\r\n"x, y","say ""hi"""\r\n')).toEqual([
      ['a', 'b'],
      ['x, y', 'say "hi"'],
    ])
  })

  it('maps rows to header keys and skips blank lines', () => {
    expect(parseCsvObjects('Username,Full Name\nriya.p, Riya P \n\n')).toEqual([{ username: 'riya.p', full_name: 'Riya P' }])
  })
})
