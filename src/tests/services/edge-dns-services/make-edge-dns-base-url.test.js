import { makeEdgeDNSBaseUrl } from '@/services/edge-dns-services/make-edge-dns-base-url'
import { assert, describe, it } from 'vitest'

const makeSut = () => {
  const sut = makeEdgeDNSBaseUrl

  return {
    sut
  }
}

describe('EdgeDnsServices', () => {
  it('should return the API base url to edge dns service', () => {
    const { sut } = makeSut()
    const version = 'v3'
    const correctApiUrl = `${version}/intelligent_dns`

    const baseUrl = sut()

    assert.strictEqual(baseUrl, correctApiUrl)
  })
})
