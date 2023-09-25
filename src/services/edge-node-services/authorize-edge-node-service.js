import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeEdgeNodeListBaseUrl } from './make-edge-node-list-base-url'

export const authorizeEdgeNodeService = async (id) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeEdgeNodeListBaseUrl()}/${id}`,
    method: 'PATCH',
    body: { status: 'Authorized' }
  })

  return parseHttpResponse(httpResponse)
}
