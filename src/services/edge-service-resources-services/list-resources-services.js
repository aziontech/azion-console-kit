import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeResourcesBaseUrl } from './make-resources-base-url'

export const listResourcesServices = async ({
  id,
  orderBy = 'name',
  sort = 'asc',
  page = 1,
  pageSize = 10
}) => {
  const searchParams = makeSearchParams({ orderBy, sort, page, pageSize })
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeResourcesBaseUrl()}/${id}/resources?${searchParams.toString()}`,
    method: 'GET'
  })

  httpResponse = adapt(httpResponse)

  return parseHttpResponse(httpResponse)
}

const adapt = (httpResponse) => {
  const isArray = Array.isArray(httpResponse.body.resources)

  const parsedRecords = isArray
    ? httpResponse.body.resources.map((resource) => ({
        id: resource.id,
        name: resource.name,
        trigger: resource.trigger,
        contentType: resource.content_type,
        lastEditor: resource.last_editor,
        lastModified: new Intl.DateTimeFormat('us', { dateStyle: 'full' }).format(
          new Date(resource.updated_at)
        ),
        lastModifiedDate: resource.updated_at
      }))
    : []

  return {
    body: parsedRecords,
    statusCode: httpResponse.statusCode
  }
}

const makeSearchParams = ({ orderBy, sort, page, pageSize, filter = '' }) => {
  const searchParams = new URLSearchParams()
  searchParams.set('filter', filter)
  searchParams.set('order_by', orderBy)
  searchParams.set('sort', sort)
  searchParams.set('page', page)
  searchParams.set('page_size', pageSize)

  return searchParams
}
