import { describe, expect, it } from 'vitest'
import { convertDateToLocalTimezone } from '@/helpers'

const makeSut = () => {
  const sut = convertDateToLocalTimezone

  return {
    sut
  }
}

describe('convertDateToLocalTimezone', () => {
  it('should convert a date to the local timezone', () => {
    const utcOffset = '+0200'
    const dateInUtcFormat = new Date('2022-01-01T00:00:00Z')
    const { sut } = makeSut()

    const convertedDate = sut(utcOffset, dateInUtcFormat)
    const expectedDate = '2022-01-01T23:59:59'

    expect(convertedDate).toBe(expectedDate)
  })

  it('should throw an error if date is not an instance of Date', () => {
    const utcOffset = '+0200'
    const date = 'not a date'
    const { sut } = makeSut()

    expect(() => sut(utcOffset, date)).toThrow('date must be an instance of Date')
  })
})
