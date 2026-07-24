import { describe, it, expect } from 'vitest'
import { rowKey } from '../row-key'

describe('rowKey', () => {
  it('returns row.id when present', () => {
    expect(rowKey({ id: 'abc' })).toBe('abc')
    expect(rowKey({ id: 7 })).toBe(7)
  })

  it('falls back to object identity when id is null/undefined', () => {
    const row = { name: 'x' }
    expect(rowKey(row)).toBe(row)
    const withNull = { id: null }
    expect(rowKey(withNull)).toBe(withNull)
  })

  it('treats id === 0 as a valid identity (not null)', () => {
    expect(rowKey({ id: 0 })).toBe(0)
  })

  it('does not throw on null/undefined input (returns the input itself)', () => {
    expect(rowKey(null)).toBeNull()
    expect(rowKey(undefined)).toBeUndefined()
  })
})
