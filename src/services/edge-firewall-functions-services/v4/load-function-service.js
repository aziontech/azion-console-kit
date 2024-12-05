import { AxiosHttpClientAdapter, parseHttpResponse } from '@/services/axios/AxiosHttpClientAdapter'
import { extractApiError } from '@/helpers/extract-api-error'
import { makeEdgeFirewallBaseUrl } from '../../edge-firewall-services/v4/make-edge-firewall-base-url'

export const loadFunctionService = async ({ edgeFirewallID, functionID }) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeEdgeFirewallBaseUrl()}/${edgeFirewallID}/functions/${functionID}`,
    method: 'GET'
  })

  httpResponse = adapt(httpResponse)

  return parseHttpResponse(httpResponse)
}

const adapt = ({ body, statusCode }) => {
  if (statusCode !== 200) {
    throw new Error(extractApiError({ body })).message
  }

  const responseBody = body.data

  const parsedVariable = {
    id: responseBody.id,
    edgeFunctionID: responseBody.edge_function,
    name: responseBody.name,
    args: JSON.stringify(responseBody.json_args, null, '\t')
  }

  return {
    body: parsedVariable,
    statusCode: statusCode
  }
}
