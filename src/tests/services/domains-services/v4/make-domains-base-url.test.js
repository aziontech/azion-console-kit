import { makeDomainsBaseUrl } from '@/services/domains-services/v4/make-domains-service'
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
    const version = 'v4'
    const correctApiUrl = `${version}/workspace/workloads`

    const baseUrl = sut()

    assert.strictEqual(baseUrl, correctApiUrl)
  })
})
