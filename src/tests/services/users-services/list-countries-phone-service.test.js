import { listCountriesPhoneService } from '@/services/users-services'
import { describe, expect, it } from 'vitest'

const makeSut = () => {
  const sut = listCountriesPhoneService

  return {
    sut
  }
}

describe('UsersServices', () => {
  it('should return a non-empty list of countries', async () => {
    const { sut } = makeSut()

    const result = await sut()

    expect(result.length).toBeGreaterThan(0)
  })

  it('should parsed correctly each countries', async () => {
    const { sut } = makeSut()

    const result = await sut()

    const brazil = result.find((country) => country.value === 'BR - 55')

    expect(brazil).toEqual({
      label: 'BR (Brazil) +55',
      labelFormat: 'BR +55',
      value: 'BR - 55'
    })
  })

  it('should return countries with correct format', async () => {
    const { sut } = makeSut()

    const result = await sut()

    result.forEach((country) => {
      expect(country).toHaveProperty('label')
      expect(country).toHaveProperty('labelFormat')
      expect(country).toHaveProperty('value')
      expect(country.value).toMatch(/^[A-Z]{2} - .+$/)
    })
  })
})
