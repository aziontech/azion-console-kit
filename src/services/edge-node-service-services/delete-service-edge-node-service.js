import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeEdgeNodeListBaseUrl } from '../edge-node-services/make-edge-node-list-base-url'

export const deleteService = async ({edgeNodeId, serviceId}) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeEdgeNodeListBaseUrl()}/${edgeNodeId}/services/${serviceId}`,
    method: 'DELETE'
  })

  return parseHttpResponse(httpResponse)
}
