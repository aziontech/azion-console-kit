import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  convertValueToDate,
  convertDateToLocalTimezone,
  formatDateToUS,
  formatDateMonthAndYear,
  formatDateToUSBilling,
  formatExhibitionDate,
  getCurrentMonthStartEnd,
  convertToRelativeTime,
  getRemainingDays
} from '@/helpers/convert-date'
import { localeMock } from '../utils/localeMock'

describe('convertDate', () => {
  it('should convert a given value to a date string in a specific format', () => {
    const value = '2022-01-01T00:00:00'
    const expectedDate = 'January 1, 2022 at 12:00:00 AM'

    expect(convertValueToDate(value)).toBe(expectedDate)
  })

  it('should convert a date to the local timezone', () => {
    const utcOffset = '+0300'
    const dateInUtcFormat = new Date('2022-01-01T00:00:00Z')

    const convertedDate = convertDateToLocalTimezone(dateInUtcFormat, utcOffset)
    const expectedDate = '2022-01-01T23:59:59'

    expect(convertedDate).toBe(expectedDate)
  })

  it('should format a date string to "MM/DD/YYYY"', () => {
    const input = '2024-07-02'
    const expectedDateString = '07/02/2024'
    const actualDateString = formatDateToUS(input)

    expect(actualDateString).toEqual(expectedDateString)
  })

  it('should format a timestamp to "MM/DD/YYYY"', () => {
    const input = '2024-07-30' // timestamp for '2024-07-02'
    const expectedDateString = '07/30/2024'
    const actualDateString = formatDateToUS(input)

    expect(actualDateString).toEqual(expectedDateString)
  })

  it('should throw an error for an invalid date', () => {
    const input = 'invalid-date'
    expect(() => formatDateToUS(input)).toThrow('Invalid date')
  })

  it('Format month and year to "MM/YYYY"', () => {
    const month = 5
    const year = 2022
    const expectedDateString = '05/2022'
    const actualDateString = formatDateMonthAndYear(month, year)

    expect(actualDateString).toEqual(expectedDateString)
  })

  it('Format single-digit month and year to "MM/YYYY"', () => {
    const month = 11
    const year = 2023
    const expectedDateString = '11/2023'
    const actualDateString = formatDateMonthAndYear(month, year)

    expect(actualDateString).toEqual(expectedDateString)
  })

  it('Formats the date from "YYYY-MM-DD" to this date "MM/DD/YYYY', () => {
    const dateString = '2024-07-01'
    const expectedDateString = '07/01/2024'
    const actualDateString = formatDateToUSBilling(dateString)

    expect(actualDateString).toEqual(expectedDateString)
  })

  it('Should return "---" when it is invalid date value', () => {
    const dateString = '123'
    const secondDateStringToCheck = '2022/01.1'
    const expectedDateString = '---'
    const actualDateString = formatDateToUSBilling(dateString)
    const actualDateStringSecondCheck = formatDateToUSBilling(secondDateStringToCheck)

    expect(actualDateString).toEqual(expectedDateString)
    expect(actualDateStringSecondCheck).toEqual(expectedDateString)
  })

  it('correctly formats a valid date string with short date and time styles', () => {
    localeMock()

    const dateString = '2023-10-05T15:30:00Z'
    const result = formatExhibitionDate(dateString, 'short', 'short')
    expect(result).toBe('10/5/23, 3:30 PM')
  })

  it('throws an error when given an invalid date string', () => {
    localeMock()

    const dateString = 'invalid-date'
    expect(() => formatExhibitionDate(dateString, 'short', 'short')).toThrow()
  })

  it('should return the correct start and end dates for the current month', () => {
    const mockDate = new Date('2023-11-15T10:00:00Z')
    vi.setSystemTime(mockDate)

    const result = getCurrentMonthStartEnd()

    expect(result).toEqual({
      dateInitial: '2023-11-01',
      dateFinal: '2023-11-30'
    })

    vi.useRealTimers()
  })
})

describe('convertToRelativeTime', () => {
  const NOW = new Date('2026-03-15T12:00:00Z')
  const SECOND_IN_MILLISECONDS = 1_000
  const MINUTE_IN_MILLISECONDS = 60_000
  const HOUR_IN_MILLISECONDS = 3_600_000
  const DAY_IN_MILLISECONDS = 86_400_000

  const isoBefore = (milliseconds) => new Date(NOW.getTime() - milliseconds).toISOString()

  beforeEach(() => {
    vi.setSystemTime(NOW)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns a dash when there is no date', () => {
    expect(convertToRelativeTime(null)).toBe('-')
    expect(convertToRelativeTime(undefined)).toBe('-')
    expect(convertToRelativeTime('')).toBe('-')
  })

  it('returns "Just now" below one minute', () => {
    expect(convertToRelativeTime(isoBefore(30 * SECOND_IN_MILLISECONDS))).toBe('Just now')
  })

  it('returns the singular minute label at exactly one minute', () => {
    expect(convertToRelativeTime(isoBefore(MINUTE_IN_MILLISECONDS))).toBe('1 minute ago')
  })

  it('returns the plural minute label below one hour', () => {
    expect(convertToRelativeTime(isoBefore(30 * MINUTE_IN_MILLISECONDS))).toBe('30 minutes ago')
  })

  it('returns the singular hour label at exactly one hour', () => {
    expect(convertToRelativeTime(isoBefore(HOUR_IN_MILLISECONDS))).toBe('1 hour ago')
  })

  it('returns the plural hour label below one day', () => {
    expect(convertToRelativeTime(isoBefore(5 * HOUR_IN_MILLISECONDS))).toBe('5 hours ago')
  })

  it('returns "Yesterday" at exactly one day', () => {
    expect(convertToRelativeTime(isoBefore(DAY_IN_MILLISECONDS))).toBe('Yesterday')
  })

  it('returns the day label below one week', () => {
    expect(convertToRelativeTime(isoBefore(3 * DAY_IN_MILLISECONDS))).toBe('3 days ago')
  })

  it('returns "Last week" below two weeks', () => {
    expect(convertToRelativeTime(isoBefore(9 * DAY_IN_MILLISECONDS))).toBe('Last week')
  })

  it('returns "Last month" for the previous month of the same year', () => {
    expect(convertToRelativeTime('2026-02-23T12:00:00Z')).toBe('Last month')
  })

  it('returns the month name for older months of the same year', () => {
    expect(convertToRelativeTime('2026-01-10T12:00:00Z')).toBe('On January')
  })

  it('returns "Last year" for the previous year', () => {
    expect(convertToRelativeTime('2025-11-10T12:00:00Z')).toBe('Last year')
  })

  it('returns the year count for older years', () => {
    expect(convertToRelativeTime('2023-03-15T12:00:00Z')).toBe('3 years ago')
  })
})

describe('getRemainingDays', () => {
  const NOW = new Date('2026-03-15T12:00:00Z')

  beforeEach(() => {
    vi.setSystemTime(NOW)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('counts the remaining days inclusively', () => {
    expect(getRemainingDays('2026-03-20')).toBe(6)
  })

  it('returns zero when the date is already expired', () => {
    expect(getRemainingDays('2026-03-10')).toBe(0)
  })

  it('returns zero when the date is missing or unparseable', () => {
    expect(getRemainingDays(null)).toBe(0)
    expect(getRemainingDays('not-a-date')).toBe(0)
  })
})
