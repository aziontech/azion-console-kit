import { makePersonalTokensBaseUrl } from '@/services/personal-tokens-services/make-personal-tokens-base-url'
import { assert, describe, it } from 'vitest'

const makeSut = () => {
  const sut = makePersonalTokensBaseUrl

  return {
    sut
  }
}

describe('PersonalTokensServices', () => {
  it('should return the API base url to personal tokens service', () => {
    const { sut } = makeSut()
    const correctApiUrl = 'iam/personal_tokens'

    const baseUrl = sut()

    assert.strictEqual(baseUrl, correctApiUrl)
  })
})
