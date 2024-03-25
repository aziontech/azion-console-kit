import { describe, expect, it } from 'vitest'
import '@modules/real-time-metrics/helpers/convert-date'

describe('Date.prototype', () => {
  it('should contain added prototype methods', () => {
    const addedMethods = [
      'removeSelectedAmountOfHours',
      'removeZone',
      'toUTC',
      'resetUTC',
      'toBeholderFormat',
      'fromLocaletoBeholderFormat'
    ]

    const prototypeMethods = Object.keys(Date.prototype)

    expect(addedMethods).toEqual(prototypeMethods)
  })

  it('should remove the specified amount of hours from a date', () => {
    const date = new Date('2022-01-01T05:00:00Z')
    const hoursToRemove = 2
    const expectedDate = new Date('2022-01-01T03:00:00Z')

    expect(date.removeSelectedAmountOfHours(hoursToRemove)).toEqual(expectedDate)
  })

  it('should set the current date to UTC0 and remove Timezone tag', () => {
    const date = new Date('2022-01-01T00:00:00Z')
    const expectedDate = '2022-01-01T00:00:00'

    expect(date.removeZone()).toBe(expectedDate)
  })

  it('should convert date to UTC based on user offset', () => {
    const date = new Date('2022-01-01T00:00:00Z')
    const expectedDate = new Date('2022-01-01T00:03:00.000Z')

    expect(date.toUTC(5)).toEqual(expectedDate)
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
    const expectedFormattedDate = '2022-01-01T00:00:00'

    expect(date.fromLocaletoBeholderFormat()).toBe(expectedFormattedDate)
  })
})
