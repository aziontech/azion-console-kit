import { makeTeamPermissionBaseUrl } from '@/services/team-permission/make-team-permission-base-url'
import { assert, describe, it } from 'vitest'

const makeSut = () => {
  const sut = makeTeamPermissionBaseUrl

  return {
    sut
  }
}

describe('TeamPermissionService', () => {
  it('should return the API base url to variables service', () => {
    const { sut } = makeSut()
    const correctApiUrl = 'iam/teams'

    const baseUrl = sut()

    assert.strictEqual(baseUrl, correctApiUrl)
  })
})
