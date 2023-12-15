import { makeUsersBaseUrl } from '@/services/users-services/make-users-base-url'
import { assert, describe, it } from 'vitest'

const makeSut = () => {
  const sut = makeUsersBaseUrl

  return {
    sut
  }
}

describe('UsersServices', () => {
  it('should return the API base url to users service', () => {
    const { sut } = makeSut()
    const version = 'v4'
    const correctApiUrl = `${version}/iam/users`

    const baseUrl = sut()

    assert.strictEqual(baseUrl, correctApiUrl)
  })
})
