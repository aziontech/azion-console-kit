import { assert, describe, it } from 'vitest'
import { makeAccountBaseUrl } from '@services/account-services/make-account-base-url'

const makeSut = () => {
  const sut = makeAccountBaseUrl

  return {
    sut
  }
}

describe.concurrent('AccountServices', () => {
  it('should return the API base url', () => {
    const { sut } = makeSut()
    const correctApiUrl = 'account/info'

    const baseUrl = sut()

    assert.strictEqual(baseUrl, correctApiUrl)
  })
})
