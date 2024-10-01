import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeEdgeNodeBaseUrl } from './make-edge-node-base-url'

export const loadEdgeNodeService = async ({ id }) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeEdgeNodeBaseUrl()}/${id}`,
    method: 'GET'
  })

  httpResponse = adapt(httpResponse, id)
  return parseHttpResponse(httpResponse)
}

const adapt = (httpResponse, id) => {
  const edgeNode = {
    name: httpResponse.body.name,
    id: id,
    hashId: httpResponse.body.hash_id,
    groups: httpResponse.body.groups,
    hasServices: httpResponse.body.has_services
  }

  return {
    body: edgeNode,
    statusCode: httpResponse.statusCode
  }
}
