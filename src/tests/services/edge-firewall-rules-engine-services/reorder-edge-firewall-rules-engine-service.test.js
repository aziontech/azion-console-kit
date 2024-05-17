import { reorderEdgeFirewallRulesEngine } from '@/services/edge-firewall-rules-engine-services/reorder-edge-firewall-rules-engine-service'
import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { makeEdgeFirewallRulesEngineReorderBaseUrl } from '@/services/edge-firewall-rules-engine-services/make-edge-firewall-rules-engine-base-url'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  edgeFirewallId: '123',
  edgeFirewallMock: [
    { id: 1, newIndex: 1 },
    { id: 2, newIndex: 0 }
  ]
}

const makeSut = () => {
  const sut = reorderEdgeFirewallRulesEngine

  return {
    sut
  }
}

describe('reorderEdgeFirewallRulesEngine', () => {
  it('should call api with correct params', async () => {
    const expectedBody = { order: [2, 1] }

    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200
    })

    const { sut } = makeSut()
    await sut(fixtures.edgeFirewallMock, fixtures.edgeFirewallId)

    expect(requestSpy).toHaveBeenCalledWith({
      url: makeEdgeFirewallRulesEngineReorderBaseUrl(fixtures.edgeFirewallId),
      method: 'PUT',
      body: expectedBody
    })
  })
})