import { describe, it, expect, afterEach, vi } from 'vitest'
import { getScriptRunnerImage } from '@/helpers/get-script-runner-image'

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
    expect(image).toBe('azionedge/runner-static-website-with-cli-stage:2.1-alpine3.16')
  })

  it('should return the correct image for the production environment', () => {
    vi.stubEnv('MODE', 'production')
    const { sut } = makeSut()
    const image = sut()
    expect(image).toBe('azionedge/runner-static-website-with-cli:2.1-alpine3.16')
  })

  it('should return the default image for an unspecified environment', () => {
    vi.stubEnv('MODE', 'test')
    const { sut } = makeSut()
    const image = sut()
    expect(image).toBe('azionedge/runner-static-website-with-cli-stage:2.1-alpine3.16')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })
})