import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeEdgeNodeBaseUrl } from '../edge-node-services/make-edge-node-base-url'

export const deleteEdgeNodeService = async ({ edgeNodeId, serviceId }) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeEdgeNodeBaseUrl()}/${edgeNodeId}/services/${serviceId}`,
    method: 'DELETE'
  })

  return parseHttpResponse(httpResponse)
}
