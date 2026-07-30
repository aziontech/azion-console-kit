import { describe, it, expect, vi } from 'vitest'
import { generateCurrentTimestamp } from '@/helpers/generate-timestamp'

describe('generateCurrentTimestamp', () => {
  it('should return a string starting with the current timestamp', () => {
    const mockDate = new Date('2023-11-15T10:00:00Z')
    const mockTimestamp = mockDate.getTime()
    vi.setSystemTime(mockDate)

    const result = generateCurrentTimestamp()

    expect(typeof result).toBe('string')
    expect(result).toMatch(new RegExp(`^${mockTimestamp}_\\d+$`))

    vi.useRealTimers()
  })

  it('should return unique values for consecutive calls within the same millisecond', () => {
    const mockDate = new Date('2023-11-15T10:00:00Z')
    vi.setSystemTime(mockDate)

    const ids = Array.from({ length: 100 }, () => generateCurrentTimestamp())
    const unique = new Set(ids)

    expect(unique.size).toBe(100)

    vi.useRealTimers()
  })
})
