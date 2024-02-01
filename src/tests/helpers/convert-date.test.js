import { describe, expect, it } from 'vitest'
import '@/helpers/convert-date'
import {
  removeSelectedAmountOfHours,
  formatToEndOfDayIsoDate,
  convertOffsetToDecimal
} from '@/helpers/convert-date'

describe('convertDate', () => {
  describe('removeSelectedAmountOfHours', () => {
    it('should remove the specified amount of hours from a date', () => {
      const date = new Date('2022-01-01T05:00:00Z')
      const hoursToRemove = 2
      const expectedDate = new Date('2022-01-01T03:00:00Z')

      expect(removeSelectedAmountOfHours(hoursToRemove, date)).toEqual(expectedDate)
    })
  })

  describe('formatToEndOfDayIsoDate', () => {
    it('should format a date to ISO format without milliseconds', () => {
      const date = new Date('2022-01-01T23:59:59.999Z')
      const expectedFormattedDate = '2022-01-01T23:59:59'

      expect(formatToEndOfDayIsoDate(date)).toBe(expectedFormattedDate)
    })
  })

  describe('convertOffsetToDecimal', () => {
    it('should convert a UTC offset to decimal format', () => {
      const offset = '+0300'
      const expectedDecimal = '+03.00'

      expect(convertOffsetToDecimal(offset)).toBe(expectedDecimal)
    })
  })

  describe('Date.prototype methods', () => {
    it('should convert date to UTC based on user offset', () => {
      const date = new Date('2022-01-01T00:00:00Z')
      const expectedDate = new Date('2022-01-01T00:00:00.000Z')

      expect(date.toUTC(0)).toEqual(expectedDate)
    })

    it('should reset date to specified UTC offset', () => {
      const date = new Date('2022-01-01T00:00:00Z')
      const userUTC = '+0200'
      const expectedDate = new Date('2021-12-31T22:00:00Z')

      expect(date.resetUTC(userUTC)).toEqual(expectedDate)
    })

    it('should format date to Beholder format', () => {
      const date = new Date('2022-01-01T00:00:00.000Z')
      const expectedFormattedDate = '2022-01-01T00:00:00'

      expect(date.toBeholderFormat()).toBe(expectedFormattedDate)
    })

    it('should convert local date to Beholder format', () => {
      const date = new Date('2022-01-01T00:00:00')
      date.toLocaleString = () => '01/01/2022, 00:00:00'
      const expectedFormattedDate = '2022-01-01T00:00:00'

      expect(date.fromLocaletoBeholderFormat()).toBe(expectedFormattedDate)
    })

    it('should convert a date to the local timezone', () => {
      const utcOffset = '+0200'
      const dateInUtcFormat = new Date('2022-01-01T00:00:00Z')

      const convertedDate = dateInUtcFormat.convertDateToLocalTimezone(utcOffset)
      const expectedDate = '2022-01-01T23:59:59'

      expect(convertedDate).toBe(expectedDate)
    })
  })
})
