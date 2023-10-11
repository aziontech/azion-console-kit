import { assert, describe, it } from 'vitest'
import { makeAuthTokenBaseUrl } from '@services/auth-services/make-auth-token-base-url'

const makeSut = () => {
  const sut = makeAuthTokenBaseUrl

  return {
    sut
  }
}

describe('AuthServices', () => {
  it('should return the API base url to auth token service', () => {
    const { sut } = makeSut()
    const correctApiUrl = 'token'

    const baseUrl = sut()

    assert.strictEqual(baseUrl, correctApiUrl)
  })
})
