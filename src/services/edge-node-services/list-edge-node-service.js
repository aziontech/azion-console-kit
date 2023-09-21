import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeEdgeNodeListBaseUrl } from './make-edge-node-list-base-url'

export const listEdgeNodeService = async () => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeEdgeNodeListBaseUrl()}`,
    method: 'GET'
  })

  httpResponse = adapt(httpResponse)
  return parseHttpResponse(httpResponse)
}

const adapt = (httpResponse) => {
  const isArray = Array.isArray(httpResponse.body.nodes)

  const edgeNodes = isArray
    ? httpResponse.body.results.map((element) => ({
        id: element.id,
        name: element.name,
        groups: element.groups,
        hashId: element.hash_id,
        status: element.status,
      }))
    : []

  return {
    body: edgeNodes,
    statusCode: httpResponse.statusCode
  }
}
