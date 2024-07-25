import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeEdgeServiceBaseUrl } from './make-edge-service-base-url'

export const listEdgeServiceServices = async ({
  orderBy = 'id',
  sort = 'asc',
  page = 1,
  pageSize = 200
}) => {
  const searchParams = makeSearchParams({ orderBy, sort, page, pageSize })
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeEdgeServiceBaseUrl()}?${searchParams.toString()}`,
    method: 'GET'
  })

  httpResponse = adapt(httpResponse)

  return parseHttpResponse(httpResponse)
}
const parseStatusData = (status) => {
  const parsedStatus = status
    ? {
        content: 'Active',
        severity: 'success'
      }
    : {
        content: 'Inactive',
        severity: 'danger'
      }

  return parsedStatus
}

const adapt = (httpResponse) => {
  const parsedEdgeServices =
    httpResponse.body.results?.map((edgeService) => {
      return {
        id: edgeService.id,
        name: edgeService.name,
        labelActive: parseStatusData(edgeService.is_active),
        active: edgeService.is_active,
        lastEditor: edgeService.last_editor,
        lastModified: new Intl.DateTimeFormat('us', { dateStyle: 'full' }).format(
          new Date(edgeService.last_modified)
        ),
        lastModifiedDate: edgeService.last_modified
      }
    }) || []

  return {
    body: parsedEdgeServices,
    statusCode: httpResponse.statusCode
  }
}

const makeSearchParams = ({ page, pageSize }) => {
  const searchParams = new URLSearchParams()
  searchParams.set('page', page)
  searchParams.set('page_size', pageSize)

  return searchParams
}
