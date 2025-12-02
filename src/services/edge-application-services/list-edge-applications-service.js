import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeEdgeApplicationBaseUrl } from './make-edge-application-base-url'
import { queryClient } from '@/services/v2/base/query/queryClient'
import { waitForPersistenceRestore } from '@/services/v2/base/query/queryPlugin'
import { createFinalKey } from '@/services/v2/base/query/keyFactory'
import { getCacheOptions, CACHE_TYPE } from '@/services/v2/base/query/queryOptions'
import { edgeAppV3Keys } from './load-edge-application-service'

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
  await waitForPersistenceRestore()

  const params = { orderBy, sort, page, pageSize }
  const queryKey = [...edgeAppV3Keys.all, 'list', orderBy, sort, page, pageSize]

  const queryOptions = {
    meta: { persist: page === 1, cacheType: CACHE_TYPE.GLOBAL },
    ...getCacheOptions(CACHE_TYPE.GLOBAL)
  }

  return await queryClient.ensureQueryData({
    queryKey: createFinalKey(queryKey),
    queryFn: () => fetchList(params),
    ...queryOptions
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
