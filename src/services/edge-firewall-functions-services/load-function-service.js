import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeEdgeFirewallBaseUrl } from './make-edge-firewall-base-url'

export const loadFunctionService = async ({ edgeFirewallID, functionID }) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeEdgeFirewallBaseUrl()}/${edgeFirewallID}/functions_instances/${functionID}`,
    method: 'GET'
  })

  httpResponse = adapt(httpResponse)

  return parseHttpResponse(httpResponse)
}

const adapt = (httpResponse) => {
  const parsedVariable = {
    id: httpResponse.body.results.id,
    edgeFunctionID: httpResponse.body.results.edge_function,
    name: httpResponse.body.results.name,
    args: JSON.stringify(httpResponse.body.results.json_args, null, '\t')
  }

  return {
    body: parsedVariable,
    statusCode: httpResponse.statusCode
  }
}
