import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeEdgeNodeBaseUrl } from './make-edge-node-base-url'

export const authorizeEdgeNodeService = async (id) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeEdgeNodeBaseUrl()}/${id}`,
    method: 'PATCH',
    body: { status: 'Authorized' }
  })

  return parseHttpResponse(httpResponse)
}
