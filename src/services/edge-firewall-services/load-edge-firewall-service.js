import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeEdgeFirewallBaseUrl } from './make-edge-firewall-base-url'

export const loadEdgeFirewallService = async ({ id }) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeEdgeFirewallBaseUrl()}/${id}`,
    method: 'GET'
  })
  httpResponse = adapt(httpResponse)

  return parseHttpResponse(httpResponse)
}

const adapt = ({ body, statusCode }) => {
  const payload = body.results
  const parsedBody = {
    id: payload.id,
    name: payload.name,
    isActive: payload.is_active,
    edgeFunctionsEnabled: payload.edge_functions_enabled,
    networkProtectionEnabled: payload.network_protection_enabled,
    wafEnabled: payload.waf_enabled,
    debugRules: payload.debug_rules,
    domains: payload.domains || [],
    ddosProtectionUnmetered: true
  }

  return {
    body: parsedBody,
    statusCode
  }
}
