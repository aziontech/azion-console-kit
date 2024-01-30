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
    const date = new Date('2022-01-01T00:00:00Z') // This is a date in UTC
      const { sut } = makeSut()

    const convertedDate = sut(utcOffset, date)

    // The exact result will depend on the implementation of makeSut
    // and the timezone of the environment where the test is run.
    // This is just an example of what the result might look like.
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