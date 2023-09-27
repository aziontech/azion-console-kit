import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeEdgeNodeListBaseUrl } from './make-edge-node-list-base-url'

export const editEdgeNodeService = async (payload) => {
  const bodyRequest = adapt(payload)
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeEdgeNodeListBaseUrl()}/${payload.id}`,
    method: 'PATCH',
    body: bodyRequest
  })
  return parseHttpResponse(httpResponse)
}

const adapt = (payload) => {
  return {
    name: payload.name,
    hash_id: payload.hash_id,
    modules: payload.modules,
    has_services: payload.has_services,
    groups: payload.groups,
    status: payload.status
  }
}
