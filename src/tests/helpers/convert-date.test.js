import { describe, it, expect } from 'vitest'
import {
  convertValueToDate,
  convertDateToLocalTimezone,
  formatDateMonthAndYear,
  getExpiredDate
} from '@/helpers/convert-date'

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

  it('Format month and year to "MM/YYYY"', () => {
    const month = 5
    const year = 2022
    const expectedDateString = '05/2022'
    const actualDateString = formatDateMonthAndYear(month, year)

    expect(actualDateString).toEqual(expectedDateString)
  })

  it('Format single-digit month and year to "MM/YYYY"', () => {
    const month = 9
    const year = 2023
    const expectedDateString = '09/2023'
    const actualDateString = formatDateMonthAndYear(month, year)

    expect(actualDateString).toEqual(expectedDateString)
  })

  it('Check expiration status for a future date', () => {
    const month = 10
    const year = 2024

    const expectedStatus = ''
    const actualStatus = getExpiredDate(month, year)

    expect(actualStatus).toEqual(expectedStatus)
  })

  it('Check expiration status for a past date', () => {
    const month = 5
    const year = 2021

    const expectedStatus = 'Expired'
    const actualStatus = getExpiredDate(month, year)

    expect(actualStatus).toEqual(expectedStatus)
  })

  it('Check expiration status for the current month and year', () => {
    const currentDate = new Date()
    const month = currentDate.getMonth() + 1
    const year = currentDate.getFullYear()

    const expectedStatus = ''
    const actualStatus = getExpiredDate(month, year)

    expect(actualStatus).toEqual(expectedStatus)
  })
})
