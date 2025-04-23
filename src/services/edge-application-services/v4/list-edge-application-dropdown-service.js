import { AxiosHttpClientAdapter, parseHttpResponse } from '@/services/axios/AxiosHttpClientAdapter'
import { makeEdgeApplicationV4BaseUrl } from './make-edge-application-v4-base-url'
import { makeListServiceQueryParams } from '@/helpers/make-list-service-query-params'

export const listEdgeApplicationsDropdownService = async ({
  fields = '',
  search = '',
  ordering = '',
  page = 1,
  pageSize = 100
}) => {
  const searchParams = makeListServiceQueryParams({
    fields,
    ordering,
    page,
    pageSize,
    search
  })

  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeEdgeApplicationV4BaseUrl()}?${searchParams.toString()}`,
    method: 'GET'
  })

  httpResponse = adapt(httpResponse)

  return parseHttpResponse(httpResponse)
}

const adapt = (httpResponse) => {
  const parsedEdgeApplications = httpResponse.body.results?.map((edgeApplication) => {
    return {
      id: edgeApplication.id,
      name: edgeApplication.name
    }
  })

  const count = httpResponse.body?.count ?? 0

  return {
    count,
    body: parsedEdgeApplications,
    statusCode: httpResponse.statusCode
  }
}
