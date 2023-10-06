import { makeIntelligentDNSBaseUrl } from '@/services/intelligent-dns-services/make-intelligent-dns-base-url'
import { assert, describe, it } from 'vitest'

const makeSut = () => {
  const sut = makeIntelligentDNSBaseUrl

  return {
    sut
  }
}

describe('IntelligentDnsRecordsServices', () => {
  it('should return the API base url to intelligent dns service', () => {
    const { sut } = makeSut()
    const correctApiUrl = 'intelligent_dns'

    const baseUrl = sut()

    assert.strictEqual(baseUrl, correctApiUrl)
  })
})
