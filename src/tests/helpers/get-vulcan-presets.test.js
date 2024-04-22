import { describe, expect, it } from 'vitest'
import { getVulcanPresets } from '@/helpers/get-vulcan-presets'

const fixtures = {
  deliverPresets: ['next', 'angular', 'astro', 'hexo', 'react', 'vite', 'vue'],
  computePresets: ['next'],
  allPresets: ['next', 'angular', 'astro', 'hexo', 'react', 'vite', 'vue']
}

const makeSut = () => {
  const sut = getVulcanPresets
  return { sut }
}

describe('getVulcanPresets', () => {
  it('should return all presets when no type is provided', () => {
    const { sut } = makeSut()
    const result = sut()
    expect(result).toEqual(fixtures.allPresets)
  })

  it.each([
    { type: 'deliver', expected: fixtures.deliverPresets },
    { type: 'compute', expected: fixtures.computePresets }
  ])('should return $type presets when "$type" type is provided', ({ type, expected }) => {
    const { sut } = makeSut()
    const result = sut(type)
    expect(result).toEqual(expected)
  })
})
