import { makeDomainsBaseUrl } from '@/services/domains-services/make-domains-base-url'
import { assert, describe, it } from 'vitest'

const makeSut = () => {
  const sut = makeDomainsBaseUrl

  return {
    sut
  }
}

describe('DomainsServices', () => {
  it('should return the API base url to domains service', () => {
    const { sut } = makeSut()
    const correctApiUrl = 'domains'

    const baseUrl = sut()

    assert.strictEqual(baseUrl, correctApiUrl)
  })
})
