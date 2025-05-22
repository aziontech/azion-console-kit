import { AxiosHttpClientAdapter, parseHttpResponse } from '@/services/axios/AxiosHttpClientAdapter'
import { makeEdgeNodeBaseUrl } from './make-edge-node-base-url'
import { makeListServiceQueryParams } from '@/helpers/make-list-service-query-params'

export const listEdgeNodeService = async ({
  search = '',
  fields = '',
  ordering = 'name',
  page = 1,
  pageSize = 10
}) => {
  const searchParams = makeListServiceQueryParams({ fields, ordering, page, pageSize, search })
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeEdgeNodeBaseUrl()}?${searchParams.toString()}`,
    method: 'GET'
  })

  httpResponse = adapt(httpResponse)

  return parseHttpResponse(httpResponse)
}

const nodeStatusMap = {
  authorized: 'Authorized',
  waiting_authorization: 'Waiting Authorization'
}

const adapt = (httpResponse) => {
  const nodes = httpResponse.body.results

  const isArray = Array.isArray(nodes)

  const parsedEdgeNodes =
    isArray && nodes.length
      ? nodes.map((element) => ({
          id: element.id,
          name: element.name,
          hashId: element.hash_id,
          status: {
            content: nodeStatusMap[element.status],
            severity: element.status === 'authorized' ? 'success' : 'warning'
          }
        }))
      : []

  return {
    body: parsedEdgeNodes,
    statusCode: httpResponse.statusCode
  }
}
