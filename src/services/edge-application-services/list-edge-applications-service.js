import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeEdgeApplicationBaseUrl } from './make-edge-application-base-url'

export const listEdgeApplicationsService = async ({
  orderBy = 'name',
  sort = 'asc',
  page = 1,
  pageSize = 200
}) => {
  const searchParams = makeSearchParams({ orderBy, sort, page, pageSize })
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeEdgeApplicationBaseUrl()}?${searchParams.toString()}`,
    method: 'GET'
  })

  httpResponse = adapt(httpResponse)

  return parseHttpResponse(httpResponse)
}

const adapt = (httpResponse) => {
  const parsedEdgeApplications = httpResponse.body.results?.map((edgeApplication) => {
    const originNames = edgeApplication.origins?.map((origin) => origin.name)?.join(',')

    return {
      active: edgeApplication.active ? 'active' : 'disabled',
      debugRules: edgeApplication.debug_rules ? 'active' : 'disabled',
      id: edgeApplication.id,
      lastEditor: edgeApplication.last_editor,
      lastModify: new Intl.DateTimeFormat('us', { dateStyle: 'full' }).format(
        new Date(edgeApplication.last_modified)
      ),
      lastModifyDate: edgeApplication.last_modified,
      name: edgeApplication.name,
      origins: originNames
    }
  })

  return {
    body: parsedEdgeApplications,
    statusCode: httpResponse.statusCode
  }
}

const makeSearchParams = ({ orderBy, sort, page, pageSize }) => {
  const searchParams = new URLSearchParams()
  searchParams.set('order_by', orderBy)
  searchParams.set('sort', sort)
  searchParams.set('page', page)
  searchParams.set('page_size', pageSize)

  return searchParams
}
