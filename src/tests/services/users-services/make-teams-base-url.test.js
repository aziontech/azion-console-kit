import { makeTeamsBaseUrl } from '@/services/users-services/make-teams-base-url'
import { assert, describe, it } from 'vitest'

const makeSut = () => {
  const sut = makeTeamsBaseUrl

  return {
    sut
  }
}

describe('UsersServices', () => {
  it('should return the API base url to users service', () => {
    const { sut } = makeSut()
    const version = 'v4'
    const correctApiUrl = `${version}/iam/teams`

    const baseUrl = sut()

    assert.strictEqual(baseUrl, correctApiUrl)
  })
})
