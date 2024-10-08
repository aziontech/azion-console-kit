import { AxiosHttpClientAdapter, parseHttpResponse } from '@/services/axios/AxiosHttpClientAdapter'
import { makeEdgeApplicationV4BaseUrl } from './make-edge-application-v4-base-url'
import { makeListServiceQueryParams } from '@/helpers/make-list-service-query-params'

export const listEdgeApplicationsService = async ({
  fields = '',
  ordering = 'name',
  page = 1,
  pageSize = 200
}) => {
  const searchParams = makeListServiceQueryParams({ fields, ordering, page, pageSize })
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeEdgeApplicationV4BaseUrl()}/applications?${searchParams.toString()}`,
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
      origins: [],
      lastEditor: edgeApplication.last_editor,
      lastModify: dateFormat(edgeApplication.last_modified),
      lastModified: edgeApplication.last_modified
    }
  })

  return {
    body: parsedEdgeApplications,
    statusCode: httpResponse.statusCode
  }
}

const dateFormat = (date) => {
  return new Intl.DateTimeFormat('us', { dateStyle: 'full' }).format(new Date(date))
}
