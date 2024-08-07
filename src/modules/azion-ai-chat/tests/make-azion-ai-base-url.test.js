import { describe, expect, it } from 'vitest'
import { makeAzionAiBaseUrl } from '../services/make-azion-ai-base-url'

const makeSut = () => {
  return {
    sut: makeAzionAiBaseUrl
  }
}

describe('makeAzionAiBaseUrl', () => {
  it('should return the correct base url', () => {
    const { sut } = makeSut()

    const result = sut()

    expect(result).toEqual('api/v4/ai_api')
  })
})
