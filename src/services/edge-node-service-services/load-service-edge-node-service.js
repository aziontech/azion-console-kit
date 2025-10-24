import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeEdgeNodeBaseUrl } from '../edge-node-services/make-edge-node-base-url'
import { extractApiError } from '@/helpers/extract-api-error'

export const loadServiceEdgeNodeService = async ({ id, edgeNodeId }) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeEdgeNodeBaseUrl()}/${edgeNodeId}/services/${id}`,
    method: 'GET'
  })
  httpResponse = adapt(httpResponse, id)
  return parseHttpResponse(httpResponse)
}

const adapt = (httpResponse, id) => {
  if (httpResponse.statusCode !== 200) {
    throw new Error(extractApiError({ body: httpResponse.body })).message
  }

  let variables = ''

  if (httpResponse.body.variables?.length) {
    variables = httpResponse.body.variables.map((obj) => `${obj.name}=${obj.value}`).join('\n')
  }

  const service = {
    id: id,
    serviceId: httpResponse.body.service_id,
    variables: variables
  }

  return {
    body: service,
    statusCode: httpResponse.statusCode
  }
}
