import { assert, describe, it } from 'vitest'
import { makeAuthLogoutBaseUrl } from '@services/auth-services/make-auth-logout-base-url'

const makeSut = () => {
  const sut = makeAuthLogoutBaseUrl

  return {
    sut
  }
}

describe('AuthServices', () => {
  it('should return the API base url to logout service', () => {
    const { sut } = makeSut()
    const correctApiUrl = 'logout'

    const baseUrl = sut()

    assert.strictEqual(baseUrl, correctApiUrl)
  })
})
