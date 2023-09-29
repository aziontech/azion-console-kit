import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeEdgeNodeListBaseUrl } from '../edge-node-services/make-edge-node-list-base-url'

export const editService = async (edgeNodeId, payload) => {
  const bodyRequest = adapt(payload)
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeEdgeNodeListBaseUrl()}/${edgeNodeId}/services/${payload.id}`,
    method: 'PATCH',
    body: bodyRequest
  })
  return parseHttpResponse(httpResponse)
}

const adapt = (payload) => {
  let variables = []

  let rows = payload.variables.split('\n')
  for (let i = 0; i < rows.length; i++) {
    let parts = rows[i].split('=')
    if (parts.length === 2) {
      let obj = {}
      obj.name = parts[0].trim()
      obj.value = parts[1].trim()
      variables.push(obj)
    }
  }
  return {
    variables
  }
}
