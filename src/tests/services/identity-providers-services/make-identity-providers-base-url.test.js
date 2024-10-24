import { makeIdentityProvidersBaseUrl } from '@/services/identity-providers-services/make-identity-providers-base-url'
import { assert, describe, it } from 'vitest'

const makeSut = () => {
  const sut = makeIdentityProvidersBaseUrl

  return {
    sut
  }
}

describe('IdentityProvidersServices', () => {
  it('should return the API base url to identity providers service', () => {
    const { sut } = makeSut()
    const correctApiUrl = 'iam/identity_providers'

    const baseUrl = sut()

    assert.strictEqual(baseUrl, correctApiUrl)
  })
})
