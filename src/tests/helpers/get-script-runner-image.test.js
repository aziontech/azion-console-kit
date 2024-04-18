import { describe, it, expect, afterEach, vi } from 'vitest'
import { getScriptRunnerImage } from '@/helpers/get-script-runner-image'

const fixtures = {
  stageImage: 'azionedge/azion-script-builder:edge-builder-stage-0.10.0',
  productionImage: 'azionedge/azion-script-builder:edge-builder-stage-0.10.0'
}

const makeSut = () => {
  const sut = getScriptRunnerImage

  return {
    sut
  }
}

describe('getScriptRunnerImage', () => {
  it('should return the correct image for the stage environment', () => {
    vi.stubEnv('MODE', 'stage')
    const { sut } = makeSut()
    const image = sut()
    expect(image).toBe(fixtures.stageImage)
  })

  it('should return the correct image for the production environment', () => {
    vi.stubEnv('MODE', 'production')
    const { sut } = makeSut()
    const image = sut()
    expect(image).toBe(fixtures.productionImage)
  })

  it('should return the default image for an unspecified environment', () => {
    vi.stubEnv('MODE', 'test')
    const { sut } = makeSut()
    const image = sut()
    expect(image).toBe(fixtures.stageImage)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })
})
