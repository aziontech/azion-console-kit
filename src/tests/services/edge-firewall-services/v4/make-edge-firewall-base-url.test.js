import { makeEdgeFirewallBaseUrl } from '@/services/edge-firewall-services/v4/make-edge-firewall-base-url'
import { assert, describe, it } from 'vitest'

const makeSut = () => {
  const sut = makeEdgeFirewallBaseUrl

  return {
    sut
  }
}

describe('EdgeFirewallServicesV4', () => {
  it('should return the API base url to edge firewall service', () => {
    const { sut } = makeSut()
    const correctApiUrl = 'v4/edge_firewall/firewalls'

    const baseUrl = sut()

    assert.strictEqual(baseUrl, correctApiUrl)
  })
})
