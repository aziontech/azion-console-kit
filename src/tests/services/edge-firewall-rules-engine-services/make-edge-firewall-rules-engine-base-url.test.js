import { makeEdgeFirewallRulesEngineReorderBaseUrl } from '@/services/edge-firewall-rules-engine-services/make-edge-firewall-rules-engine-reorder-base-url'
import { assert, describe, it } from 'vitest'

const makeSut = () => {
  const sut = makeEdgeFirewallRulesEngineReorderBaseUrl

  return {
    sut
  }
}

describe('EdgeFirewallServices', () => {
  it('should return the API base url to edge firewall rules engine reorder service', () => {
    const edgeFirewallId = '123'
    const { sut } = makeSut()
    const correctApiUrl = `v4/edge_firewall/firewalls/${edgeFirewallId}/rules/order`

    const baseUrl = sut(edgeFirewallId)

    assert.strictEqual(baseUrl, correctApiUrl)
  })
})
