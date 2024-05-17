import { AxiosHttpClientAdapter } from '../axios/AxiosHttpClientAdapter'
import { makeEdgeFirewallRulesEngineReorderBaseUrl } from './make-edge-firewall-rules-engine-base-url'

export const reorderEdgeFirewallRulesEngine = async (payload, edgeFirewallId) => {
  await AxiosHttpClientAdapter.request({
    url: makeEdgeFirewallRulesEngineReorderBaseUrl(edgeFirewallId),
    method: 'PUT',
    body: adapt(payload)
  })
}

const adapt = (payload) => {
  const parsedPayload = {
    order: payload.sort((rule1, rule2) => rule1.newIndex - rule2.newIndex).map(({ id }) => id)
  }

  return parsedPayload
}
