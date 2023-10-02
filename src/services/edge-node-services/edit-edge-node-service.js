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
  let groups = []
  if (payload.addGroups.length) {
    groups = payload.addGroups.map((item1) => {
      let item2 = payload.groups.find((item) => item.name === item1)
      return item2 ? { id: item2.id, name: item1 } : { name: item1 }
    })
  }
  return {
    name: payload.name,
    hashId: payload.hash_id,
    modules: {
      add_services: payload.addService
    },
    hasServices: payload.has_services,
    groups: groups,
    status: payload.status
  }
}
