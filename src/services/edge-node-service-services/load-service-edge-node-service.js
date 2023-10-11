import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeEdgeNodeBaseUrl } from '../edge-node-services/make-edge-node-base-url'

export const loadServiceEdgeNodeService = async ({ edgeNodeId, id }) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeEdgeNodeBaseUrl()}/${edgeNodeId}/services/${id}`,
    method: 'GET'
  })

  httpResponse = adapt(httpResponse, id)
  return parseHttpResponse(httpResponse)
}

const adapt = (httpResponse, id) => {
  let variables = ''
  if (httpResponse.body.variables?.length) {
    variables = httpResponse.body.variables.map((obj) => `${obj.name} = ${obj.value}`).join('\n')
  }

  const service = {
    id: id,
    serviceName: httpResponse.body.service_name,
    variables: variables,
    serviceId: httpResponse.body.service_id
  }

  return {
    body: service,
    statusCode: httpResponse.statusCode
  }
}
