import { makeAccountsManagementBaseUrl } from '@/services/accounts-management-services/make-accounts-management-base-url'
import { assert, describe, it } from 'vitest'

const makeSut = () => {
  const sut = makeAccountsManagementBaseUrl

  return {
    sut
  }
}

describe('AccountsManagementServices', () => {
  it('should return the API base url to accounts management service', () => {
    const { sut } = makeSut()
    const correctApiUrl = `iam/accounts`

    const baseUrl = sut()

    assert.strictEqual(baseUrl, correctApiUrl)
  })
})
