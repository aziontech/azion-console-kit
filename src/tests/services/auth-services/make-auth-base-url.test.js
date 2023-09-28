import { assert, describe, it } from 'vitest'
import * as makeAuthBaseUrl from '@services/auth-services/make-auth-base-url'

const makeSut = () => {
  const sut = makeAuthBaseUrl

  return {
    sut
  }
}

describe.concurrent('AuthServices', () => {
  it('should return the API base url to switch account service', () => {
    const { sut } = makeSut()
    const correctApiUrl = 'switch-account'

    const baseUrl = sut.makeLoginBaseUrl().switchAccount

    assert.strictEqual(baseUrl, correctApiUrl)
  })

  it('should return the API base url to auth token service', () => {
    const { sut } = makeSut()
    const correctApiUrl = 'token'

    const baseUrl = sut.makeLoginBaseUrl().token

    assert.strictEqual(baseUrl, correctApiUrl)
  })

  it('should return the API base url to logout service', () => {
    const { sut } = makeSut()
    const correctApiUrl = 'logout'

    const baseUrl = sut.makeLogoutBaseUrl()

    assert.strictEqual(baseUrl, correctApiUrl)
  })
})
