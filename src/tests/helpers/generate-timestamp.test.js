import { describe, it, expect, vi } from 'vitest'
import { generateCurrentTimestamp } from '@/helpers/generate-timestamp'

describe('generateCurrentTimestamp', () => {
  it('should return the correct timestamp for the current date', () => {
    const mockDate = new Date('2023-11-15T10:00:00Z')
    const mockTimestamp = mockDate.getTime()
    vi.setSystemTime(mockDate)

    const result = generateCurrentTimestamp()

    expect(result).toBe(mockTimestamp)

    vi.useRealTimers()
  })
})
