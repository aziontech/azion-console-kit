import { makeEdgeFirewallBaseUrl } from '@/services/edge-firewall-services/make-edge-firewall-base-url'
import { assert, describe, it } from 'vitest'

const makeSut = () => {
  const sut = makeEdgeFirewallBaseUrl

  return {
    sut
  }
}

describe('EdgeFirewallServices', () => {
  it('should return the API base url to edge firewall service', () => {
    const { sut } = makeSut()
    const correctApiUrl = 'v3/edge_firewall'

    const baseUrl = sut()

    assert.strictEqual(baseUrl, correctApiUrl)
  })
})
