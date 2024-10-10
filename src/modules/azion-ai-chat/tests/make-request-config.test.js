import { describe, expect, it } from 'vitest'
import { makeRequestConfig } from '../services/make-request-config'

const makeSut = () => {
  return {
    sut: makeRequestConfig
  }
}

describe('makeRequestConfig', () => {
  it('should return the correct base url', () => {
    const { sut } = makeSut()

    const result = sut()

    expect(result).toEqual({ url: '/copilot/chat/completions' })
  })
})
