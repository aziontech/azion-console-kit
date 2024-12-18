import { makeEdgeDNSBaseUrl } from '@/services/edge-dns-services/v4/make-edge-dns-base-url'
import { assert, describe, it } from 'vitest'

const makeSut = () => {
  const sut = makeEdgeDNSBaseUrl

  return {
    sut
  }
}

describe('EdgeDnsServicesV4', () => {
  it('should return the API base url to edge dns service', () => {
    const { sut } = makeSut()
    const version = 'v4'
    const correctApiUrl = `${version}/edge_dns`

    const baseUrl = sut()

    assert.strictEqual(baseUrl, correctApiUrl)
  })
})
