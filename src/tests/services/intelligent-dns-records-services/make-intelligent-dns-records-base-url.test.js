import { makeIntelligentDNSRecordsBaseUrl } from '@/services/intelligent-dns-records-services/make-intelligent-dns-records-base-url'
import { assert, describe, it } from 'vitest'

const makeSut = () => {
  const sut = makeIntelligentDNSRecordsBaseUrl

  return {
    sut
  }
}

describe('IntelligentDnsRecordsServices', () => {
  it('should return the API base url to intelligent dns records service', () => {
    const { sut } = makeSut()
    const correctApiUrl = 'intelligent_dns'

    const baseUrl = sut()

    assert.strictEqual(baseUrl, correctApiUrl)
  })
})
