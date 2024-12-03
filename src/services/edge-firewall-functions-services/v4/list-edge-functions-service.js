import { AxiosHttpClientAdapter, parseHttpResponse } from '@/services/axios/AxiosHttpClientAdapter'
import { makeEdgeFunctionsBaseUrl } from './make-edge-functions-base-url'
import { makeListServiceQueryParams } from '@/helpers/make-list-service-query-params'

export const listEdgeFunctionsService = async ({
  fields = '',
  search = '',
  ordering = '',
  page = 1,
  pageSize = 10,
  initiatorType = ''
}) => {
  const searchParams = makeListServiceQueryParams({ fields, ordering, page, pageSize, search })
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeEdgeFunctionsBaseUrl()}?${searchParams.toString()}`,
    method: 'GET'
  })

  httpResponse = adapt(httpResponse, initiatorType)

  return parseHttpResponse(httpResponse)
}

const adapt = (httpResponse, initiatorType) => {
  const bodyResults = httpResponse.body.results

  const parsedEdgeFunctions = bodyResults
    ?.filter(edgeFirewall => !initiatorType || edgeFirewall.initiator_type === initiatorType)
    .map(edgeFirewall => ({
      id: edgeFirewall.id,
      name: edgeFirewall.name
    }))

  const count = httpResponse.body?.count ?? 0

  return {
    count,
    body: parsedEdgeFunctions,
    statusCode: httpResponse.statusCode
  }
}
