import { assert, describe, it } from 'vitest'
import { makeUserInfoBaseUrl } from '@services/account-services/make-user-info-base-url'

const makeSut = () => {
  const sut = makeUserInfoBaseUrl

  return {
    sut
  }
}

describe.concurrent('AccountServices', () => {
  it('should return the correct API base url', () => {
    const { sut } = makeSut()
    const correctApiUrl = 'user/me'

    const baseUrl = sut()

    assert.strictEqual(baseUrl, correctApiUrl)
  })
})
