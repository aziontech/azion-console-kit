import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeEdgeNodeBaseUrl } from './make-edge-node-base-url'
import { extractApiError } from '@/helpers/extract-api-error'

export const loadEdgeNodeService = async ({ id }) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeEdgeNodeBaseUrl()}/${id}`,
    method: 'GET'
  })

  httpResponse = adapt(httpResponse, id)
  return parseHttpResponse(httpResponse)
}

const adapt = (httpResponse, id) => {
  if (httpResponse.statusCode !== 200) {
    throw new Error(extractApiError({ body: httpResponse.body })).message
  }

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
