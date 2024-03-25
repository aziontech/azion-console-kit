import { describe, it, expect } from 'vitest'
import { convertValueToDate } from '@/helpers/convert-date'

describe('convertDate', () => {
  it('should convert a given value to a date string in a specific format', () => {
    const value = '2022-01-01T00:00:00'
    const expectedDate = 'January 1, 2022 at 12:00 AM'

    expect(convertValueToDate(value)).toBe(expectedDate)
  })
})
