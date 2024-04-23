import { describe, expect, it } from 'vitest'
import { listVulcanPresetsService } from '@/services/vulcan-services/list-vulcan-presets-service'

const makeSut = () => {
  const sut = {
    listVulcanPresetsService
  }
  return {
    sut
  }
}

describe('VulcanServices', () => {
  it('should return a list of Vulcan presets', () => {
    const { sut } = makeSut()
    const presets = sut.listVulcanPresetsService()

    expect(presets).toBeInstanceOf(Array)
    expect(presets).toHaveLength(7)
  })

  it('each preset should have the correctly properties', () => {
    const { sut } = makeSut()
    const presets = sut.listVulcanPresetsService()

    presets.forEach((preset) => {
      expect(preset).toHaveProperty('label')
      expect(preset).toHaveProperty('value')
    })
  })

  it('should return the preset with the correct value', () => {
    const { sut } = makeSut()
    const presets = sut.listVulcanPresetsService()

    expect(presets).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: 'Next.js',
          value: 'next'
        })
      ])
    )
  })
})
