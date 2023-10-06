import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeEdgeNodeBaseUrl } from './make-edge-node-base-url'

export const listEdgeNodeService = async () => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeEdgeNodeBaseUrl()}`,
    method: 'GET'
  })
  httpResponse = adapt(httpResponse)
  return parseHttpResponse(httpResponse)
}

const adapt = (httpResponse) => {
  const isArray = Array.isArray(httpResponse.body.nodes)

  const edgeNodes =
    isArray && httpResponse.body.nodes.length
      ? httpResponse.body.nodes.map((element) => ({
          id: element.id,
          name: element.name,
          groups: element.groups,
          hashId: element.hash_id,
          status: element.status
        }))
      : []

  return {
    body: edgeNodes,
    statusCode: httpResponse.statusCode
  }
}
