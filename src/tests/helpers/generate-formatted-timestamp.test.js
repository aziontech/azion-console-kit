import { generateFormattedTimestamp } from '@/helpers/generate-formatted-timestamp'
import { describe, expect, it } from 'vitest'

const makeSut = () => {
  const sut = { generateFormattedTimestamp }
  return { sut }
}

describe('GenerateFormattedTimestamp', () => {
  it('should return a string', () => {
    const { sut } = makeSut()
    const timestamp = sut.generateFormattedTimestamp()
    expect(timestamp).toBeTypeOf('string')
  })

  it('should match the expected timestamp format', () => {
    const { sut } = makeSut()
    const timestamp = sut.generateFormattedTimestamp()
    // The expected format is "YYYYMMDDHHMMSS"
    expect(timestamp).toMatch(/^\d{4}\d{2}\d{2}\d{2}\d{2}\d{2}$/)
  })

  it('should represent the current date and time', () => {
    const { sut } = makeSut()
    const timestamp = sut.generateFormattedTimestamp()
    const currentYear = new Date().getFullYear().toString()
    const currentMonth = new Date().getMonth() + 1
    const currentDate = new Date().getDate()
    const currentHours = new Date().getHours()
    const currentMinutes = new Date().getMinutes()
    const currentSeconds = new Date().getSeconds()

    const year = timestamp.substring(0, 4)
    const month = timestamp.substring(4, 6)
    const day = timestamp.substring(6, 8)
    const hours = timestamp.substring(8, 10)
    const minutes = timestamp.substring(10, 12)
    const seconds = timestamp.substring(12, 14)

    expect(year).toBe(currentYear)
    expect(month).toBe(currentMonth.toString().padStart(2, '0'))
    expect(day).toBe(currentDate.toString().padStart(2, '0'))
    expect(hours).toBe(currentHours.toString().padStart(2, '0'))
    expect(minutes).toBe(currentMinutes.toString().padStart(2, '0'))
    expect(seconds).toBe(currentSeconds.toString().padStart(2, '0'))
  })
})
