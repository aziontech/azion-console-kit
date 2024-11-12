import { AxiosHttpClientAdapter, parseHttpResponse } from '@/services/axios/AxiosHttpClientAdapter'
import { makeEdgeApplicationV4BaseUrl } from '@/services/edge-application-services/v4/make-edge-application-v4-base-url'
import { makeListServiceQueryParams } from '@/helpers/make-list-service-query-params'

export const listCacheSettingsService = async ({
  id,
  fields = '',
  ordering = 'name',
  page = 1,
  pageSize = 10,
  search = ''
}) => {
  const searchParams = makeListServiceQueryParams({ fields, ordering, page, pageSize, search })
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeEdgeApplicationV4BaseUrl()}/${id}/cache_settings?${searchParams.toString()}`,
    method: 'GET'
  })

  httpResponse = adapt(httpResponse)

  return parseHttpResponse(httpResponse)
}

const formatCacheSettings = (value) => {
  const CACHE_SETTINGS_OPTIONS = {
    honor: 'Honor Origin Cache Headers',
    override: 'Override Cache Settings'
  }

  return CACHE_SETTINGS_OPTIONS[value]
}

const adapt = (httpResponse) => {
  const parseHttpResponse = httpResponse.body.results.map((cacheSettings) => ({
    id: cacheSettings.id.toString(),
    name: cacheSettings.name,
    browserCache: formatCacheSettings(cacheSettings.browser_cache.behavior),
    cdnCache: formatCacheSettings(cacheSettings.edge_cache.behavior)
  }))

  return {
    count: httpResponse.body.count,
    body: parseHttpResponse,
    statusCode: httpResponse.statusCode
  }
}
