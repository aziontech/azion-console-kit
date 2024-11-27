import * as Errors from '@/services/axios/errors'
import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { extractApiError } from '@/helpers/extract-api-error'
import { makeEdgeFirewallBaseUrl } from '../../edge-firewall-services/v4/make-edge-firewall-base-url'

export const createFunctionService = async (payload) => {
  const edgeFirewallID = payload.id
  const newPayload = adapt(payload)

  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeEdgeFirewallBaseUrl()}/${edgeFirewallID}/functions`,
    method: 'POST',
    body: newPayload
  })

  return parseHttpResponse(httpResponse)
}

const adapt = (payload) => {
  return {
    name: payload.name,
    edge_function: payload.edgeFunctionID,
    json_args: JSON.parse(payload.args)
  }
}

const parseHttpResponse = (httpResponse) => {
  switch (httpResponse.statusCode) {
    case 202:
      return {
        feedback: 'Your Function has been created'
      }
    case 500:
      throw new Errors.InternalServerError().message
    default:
      throw new Error(extractApiError(httpResponse)).message
  }
}
