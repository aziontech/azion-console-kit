import { AxiosHttpClientAdapter } from '../axios/AxiosHttpClientAdapter'
import { makeEdgeFirewallRulesEngineReorderBaseUrl } from './make-edge-firewall-rules-engine-reorder-base-url'

export const reorderEdgeFirewallRulesEngine = async (payload, edgeFirewallId) => {
  await AxiosHttpClientAdapter.request({
    url: makeEdgeFirewallRulesEngineReorderBaseUrl(edgeFirewallId),
    method: 'PUT',
    body: adapt(payload)
  })
}

const adapt = (payload) => {
  const parsedPayload = {
    order: payload
      .sort(
        (currentEdgeFirewallRulesEngine, nextEdgeFirewallRulesEngine) =>
          currentEdgeFirewallRulesEngine.newIndex - nextEdgeFirewallRulesEngine.newIndex
      )
      .map(({ id }) => id)
  }

  return parsedPayload
}
