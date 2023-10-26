import { makeAccountDetailedBaseUrl } from '@/services/users-services/make-account-detailed-base-url'
import { assert, describe, it } from 'vitest'

const makeSut = () => {
  const sut = makeAccountDetailedBaseUrl

  return {
    sut
  }
}

describe('UsersServices', () => {
  it('should return the API base url to users service', () => {
    const { sut } = makeSut()
    const correctApiUrl = 'account-details'

    const baseUrl = sut()

    assert.strictEqual(baseUrl, correctApiUrl)
  })
})
