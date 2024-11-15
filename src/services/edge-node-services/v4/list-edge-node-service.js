import { AxiosHttpClientAdapter, parseHttpResponse } from '@/services/axios/AxiosHttpClientAdapter'
import { makeEdgeNodeBaseUrl } from './make-edge-node-base-url'
import { makeListServiceQueryParams } from '@/helpers/make-list-service-query-params'

export const listEdgeNodeService = async ({
  fields = '',
  search = '',
  ordering = '',
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

const adapt = (httpResponse) => {
  const isArray = Array.isArray(httpResponse.body.results)
  const edgeNodes =
    isArray && httpResponse.body.results.length
      ? httpResponse.body.results.map((element) => ({
          id: element.id,
          name: element.name,
          hashId: element.hash_id,
          status: {
            content: element.status,
            severity: element.status === 'Authorized' ? 'success' : 'warning'
          }
        }))
      : []

  const count = httpResponse.body?.count ?? 0

  return {
    count,
    body: edgeNodes,
    statusCode: httpResponse.statusCode
  }
}
