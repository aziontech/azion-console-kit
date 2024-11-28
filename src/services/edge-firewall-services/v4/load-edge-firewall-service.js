import { extractApiError } from '@/helpers/extract-api-error'
import { AxiosHttpClientAdapter, parseHttpResponse } from '@/services/axios/AxiosHttpClientAdapter'
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
  if (statusCode !== 200) {
    throw new Error(extractApiError({ body })).message
  }

  const payload = body.data
  const parsedBody = {
    id: payload.id,
    name: payload.name,
    isActive: payload.active,
    edgeFunctionsEnabled: payload.modules.edge_functions_enabled,
    networkProtectionEnabled: payload.modules.network_protection_enabled,
    wafEnabled: payload.modules.waf_enabled,
    debugRules: payload.debug_rules,
    domains: payload.domains || [],
    ddosProtectionUnmetered: true
  }

  return {
    body: parsedBody,
    statusCode
  }
}
