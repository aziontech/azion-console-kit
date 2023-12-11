import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeEdgeNodeBaseUrl } from './make-edge-node-base-url'

export const listGroupsEdgeNodeService = async () => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeEdgeNodeBaseUrl()}/groups`,
    method: 'GET'
  })
  return parseHttpResponse(httpResponse)
}
