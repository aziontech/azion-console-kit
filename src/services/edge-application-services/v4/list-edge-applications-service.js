import { AxiosHttpClientAdapter, parseHttpResponse } from '@/services/axios/AxiosHttpClientAdapter'
import { makeEdgeApplicationV4BaseUrl } from './make-edge-application-v4-base-url'
import { makeListServiceQueryParams } from '@/helpers/make-list-service-query-params'

const DEFAULT_ORDERING_FIELD = 'name'

export const listEdgeApplicationsService = async ({
  fields = '',
  search = '',
  ordering = DEFAULT_ORDERING_FIELD,
  page = 1,
  pageSize = 200
}) => {
  ordering = ordering === null ? DEFAULT_ORDERING_FIELD : ordering
  const searchParams = makeListServiceQueryParams({ fields, ordering, page, pageSize, search })

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
      name: edgeApplication.name,
      lastEditor: edgeApplication.last_editor,
      lastModify: dateFormat(edgeApplication.last_modified),
      lastModified: edgeApplication.last_modified
    }
  })

  const count = httpResponse.body?.count ?? 0

  return {
    count,
    body: parsedEdgeApplications,
    statusCode: httpResponse.statusCode
  }
}

const dateFormat = (date) => {
  return new Intl.DateTimeFormat('us', { dateStyle: 'full' }).format(new Date(date))
}
