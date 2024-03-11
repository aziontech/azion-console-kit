import { makeEdgeDNSRecordsBaseUrl } from '@/services/edge-dns-records-services/make-edge-dns-records-base-url'
import { assert, describe, it } from 'vitest'

const makeSut = () => {
  const sut = makeEdgeDNSRecordsBaseUrl

  return {
    sut
  }
}

describe('EdgeDnsRecordsServices', () => {
  it('should return the API base url to edge dns records service', () => {
    const { sut } = makeSut()
    const version = 'v3'
    const correctApiUrl = `${version}/intelligent_dns`

    const baseUrl = sut()

    assert.strictEqual(baseUrl, correctApiUrl)
  })
})
