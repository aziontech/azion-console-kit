import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeEdgeNodeListBaseUrl } from '../edge-node-services/make-edge-node-list-base-url'
import helper from './helper'

export const editEdgeNodeService = async (edgeNodeId, payload) => {
  const bodyRequest = adapt(payload)
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeEdgeNodeListBaseUrl()}/${edgeNodeId}/services/${payload.id}`,
    method: 'PATCH',
    body: bodyRequest
  })
  return parseHttpResponse(httpResponse)
}

const adapt = (payload) => {
  const variables = helper.adaptVariables(payload)
  return {
    variables
  }
}
