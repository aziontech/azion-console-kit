import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeEdgeNodeListBaseUrl } from './make-edge-node-list-base-url'

export const loadEdgeNodeService = async ({ id }) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeEdgeNodeListBaseUrl()}/${id}`,
    method: 'GET'
  })

  httpResponse = adapt(httpResponse, id)
  return parseHttpResponse(httpResponse)
}

const adapt = (httpResponse, id) => {
  const edgeNode = {
    name: httpResponse.body.name,
    id: id,
    hashId: httpResponse.body.hash_id,
    modules: httpResponse.body.modules,
    hasServices: httpResponse.body.has_services,
    groups: httpResponse.body.groups,
    addService: httpResponse.body.modules.add_services,
    addGroups: httpResponse.body.groups.map((group) => group?.name)
  }

  return {
    body: edgeNode,
    statusCode: httpResponse.statusCode
  }
}
