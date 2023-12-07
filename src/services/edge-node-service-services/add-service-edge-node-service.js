import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeEdgeNodeBaseUrl } from '../edge-node-services/make-edge-node-base-url'

export const addServiceEdgeNodeService = async (payload) => {
  const { id } = payload
  const bodyRequest = adapt(payload)
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeEdgeNodeBaseUrl()}/${id}/services`,
    method: 'POST',
    body: bodyRequest
  })
  return parseHttpResponse(httpResponse)
}

const parseCodeToVariables = (code) => {
  if (!code) return []
  const lines = code.trim().split(/\r?\n/)

  const mapped = lines.map((line) => {
    const [name, ...rest] = line.split('=')
    const value = rest.join('=')
    return { name: name.trim(), value: value.trim() }
  })

  return mapped
}

const adapt = (payload) => {
  const variables = parseCodeToVariables(payload.variables)
  return {
    service_id: payload.service.serviceId,
    variables
  }
}
