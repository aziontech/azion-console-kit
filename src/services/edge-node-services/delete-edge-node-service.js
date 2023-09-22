import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import {  makeEdgeNodeListBaseUrl } from './make-edge-node-list-base-url'

export const deleteEdgeNodeService = async (id) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeEdgeNodeListBaseUrl()}/${id}`,
    method: 'DELETE'
  })

  return parseHttpResponse(httpResponse)
}
