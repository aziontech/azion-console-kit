import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeEdgeServiceBaseUrl } from './make-edge-service-base-url'

export const deleteEdgeServiceServices = async (id) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeEdgeServiceBaseUrl()}/${id}`,
    method: 'DELETE'
  })

  return parseHttpResponse(httpResponse)
}
