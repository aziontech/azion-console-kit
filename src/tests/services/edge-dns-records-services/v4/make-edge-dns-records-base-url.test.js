import { makeEdgeDNSRecordsBaseUrl } from '@/services/edge-dns-records-services/v4/make-edge-dns-records-base-url'
import { assert, describe, it } from 'vitest'

const makeSut = () => {
  const sut = makeEdgeDNSRecordsBaseUrl

  return {
    sut
  }
}

describe('EdgeDnsServicesV4', () => {
  it('should return the API base url to edge dns service', () => {
    const { sut } = makeSut()
    const version = 'v4'
    const correctApiUrl = `${version}/edge_dns/zones`

    const baseUrl = sut()

    assert.strictEqual(baseUrl, correctApiUrl)
  })
})
