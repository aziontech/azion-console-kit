import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeEdgeNodeBaseUrl } from '../edge-node-services/make-edge-node-base-url'
import helper from './helper'

export const addEdgeNodeService = async (id, payload) => {
  const bodyRequest = adapt(payload)
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeEdgeNodeBaseUrl()}/${id}/services`,
    method: 'POST',
    body: bodyRequest
  })
  return parseHttpResponse(httpResponse)
}

const adapt = (payload) => {
  const variables = helper.adaptVariables(payload)
  return {
    service_id: payload.serviceId,
    variables
  }
}
