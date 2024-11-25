import { AxiosHttpClientAdapter, parseHttpResponse } from '@/services/axios/AxiosHttpClientAdapter'
import { makeEdgeFirewallBaseUrl } from './make-edge-firewall-base-url'

export const loadEdgeFirewallService = async (edgeFirewallId) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeEdgeFirewallBaseUrl()}/${edgeFirewallId}?fields=id,name`,
    method: 'GET'
  })

  httpResponse = adapt(httpResponse)

  return parseHttpResponse(httpResponse)
}

const adapt = (httpResponse) => {
  const data = httpResponse.body?.data
  const parsedEdgeApplications = {
    id: data.id,
    name: data.name
  }

  return {
    body: parsedEdgeApplications,
    statusCode: httpResponse.statusCode
  }
}
