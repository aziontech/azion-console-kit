import { assert, describe, it } from 'vitest'
import { makeSwitchAccountBaseUrl } from '@services/auth-services/make-switch-account-base-url'

const makeSut = () => {
  const sut = makeSwitchAccountBaseUrl

  return {
    sut
  }
}

describe.concurrent('AuthServices', () => {
  it('should return the API base url to switch account service', () => {
    const { sut } = makeSut()
    const correctApiUrl = 'switch-account'

    const baseUrl = sut()

    assert.strictEqual(baseUrl, correctApiUrl)
  })
})
