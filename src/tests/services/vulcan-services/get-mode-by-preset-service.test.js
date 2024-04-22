import { describe, expect, it } from 'vitest'
import { getModesByPresetService } from '@/services/vulcan-services/get-mode-by-preset-service'

const makeSut = () => {
  const sut = {
    getModesByPresetService
  }
  return {
    sut
  }
}

describe('VulcanServices', () => {
  it.each([
    { preset: 'next', mode: 'deliver' },
    { preset: 'next', mode: 'compute' }
  ])('should return the correct mode for a given preset', ({ preset, mode }) => {
    const { sut } = makeSut()
    const result = sut.getModesByPresetService(preset)

    expect(result).toContain(mode)
  })

  it('should return an empty array for an invalid preset', () => {
    const { sut } = makeSut()
    const result = sut.getModesByPresetService('invalidPreset')

    expect(result).toEqual([])
  })
})
