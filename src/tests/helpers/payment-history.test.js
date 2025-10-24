import { describe, it, expect, vi } from 'vitest'
import { getLastDayMonth } from '@/helpers/payment-history'

describe('PaymentHistoryHelper', () => {
  it('should return the last day of current month in correct format', () => {
    const mockDate = new Date('2024-03-15')
    vi.useFakeTimers()
    vi.setSystemTime(mockDate)

    const expectedDate = '2024-03-31'
    const actualDate = getLastDayMonth()

    expect(actualDate).toEqual(expectedDate)
  })
})
