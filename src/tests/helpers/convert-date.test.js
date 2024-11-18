import { describe, it, expect, vi } from 'vitest'
import {
  convertValueToDate,
  convertDateToLocalTimezone,
  formatDateToUS,
  formatDateMonthAndYear,
  formatDateToUSBilling,
  formatExhibitionDate,
  getCurrentMonthStartEnd
} from '@/helpers/convert-date'
import { localeMock } from '../utils/localeMock'

describe('convertDate', () => {
  it('should convert a given value to a date string in a specific format', () => {
    const value = '2022-01-01T00:00:00'
    const expectedDate = 'January 1, 2022 at 12:00 AM'

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
    const input = 1720224000000 // timestamp for '2024-07-02'
    const expectedDateString = '07/06/2024'
    const actualDateString = formatDateToUS(input)

    expect(actualDateString).toEqual(expectedDateString)
  })

  it('should format a Date object to "MM/DD/YYYY"', () => {
    const input = new Date('2024-07-02')
    const expectedDateString = '07/02/2024'
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
    const mockDate = new Date('2023-11-15T10:00:00Z') // Example date
    vi.setSystemTime(mockDate)

    const result = getCurrentMonthStartEnd()

    expect(result).toEqual({
      dateInitial: '2023-11-01',
      dateFinal: '2023-11-30'
    })

    vi.useRealTimers()
  })
})
