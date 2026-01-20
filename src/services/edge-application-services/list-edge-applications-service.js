import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeEdgeApplicationBaseUrl } from './make-edge-application-base-url'
import { BaseService } from '@/services/v2/base/query/baseService'

const baseService = new BaseService()

const fetchList = async ({ orderBy, sort, page, pageSize }) => {
  const searchParams = makeSearchParams({ orderBy, sort, page, pageSize })
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeEdgeApplicationBaseUrl()}?${searchParams.toString()}`,
    method: 'GET'
  })

  httpResponse = adapt(httpResponse)

  return parseHttpResponse(httpResponse)
}

export const listEdgeApplicationsService = async ({
  orderBy = 'name',
  sort = 'asc',
  page = 1,
  pageSize = 200
}) => {
  const params = { orderBy, sort, page, pageSize }
  const queryKey = baseService.queryKeys.edgeAppV3.list(orderBy, sort, page, pageSize)

  return await baseService._ensureQueryData(queryKey, () => fetchList(params), {
    persist: page === 1
  })
}

const adapt = (httpResponse) => {
  const parsedEdgeApplications = httpResponse.body.results?.map((edgeApplication) => {
    const originNames = edgeApplication.origins?.map((origin) => origin.name) || []

    return {
      id: edgeApplication.id,
      name: edgeApplication.name,
      origins: originNames,
      lastEditor: edgeApplication.last_editor,
      lastModify: dateFormat(edgeApplication.last_modified),
      lastModifyDate: edgeApplication.last_modified
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

const dateFormat = (date) => {
  return new Intl.DateTimeFormat('us', { dateStyle: 'full' }).format(new Date(date))
}
