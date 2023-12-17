import { AxiosHttpClientAdapter, parseHttpResponse } from '@/services/axios/AxiosHttpClientAdapter'
import { makeEdgeApplicationBaseUrl } from '../edge-application-services/make-edge-application-base-url'

export const listDeviceGroupsService = async ({
  id,
  orderBy = 'id',
  sort = 'asc',
  page = 1,
  pageSize = 200
}) => {
  const searchParams = makeSearchParams({ orderBy, sort, page, pageSize })
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeEdgeApplicationBaseUrl()}/${id}/device_groups?${searchParams.toString()}`,
    method: 'GET'
  })

  httpResponse = adapt(httpResponse)
  return parseHttpResponse(httpResponse)
}

const adapt = (httpResponse) => {

  const parsedOrigin = httpResponse.body.results?.map((element) => {
    return {
      id: element.id,
      name: element.name,
      userAgent: element.userAgent
    }
  })

  return {
    body: parsedOrigin,
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
