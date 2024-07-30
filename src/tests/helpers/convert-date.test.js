import { describe, it, expect } from 'vitest'
import {
  convertValueToDate,
  convertDateToLocalTimezone,
  formatDateToUS,
  formatDateMonthAndYear,
  formatDateToUSBilling
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
})
