import { AxiosHttpClientAdapter, parseHttpResponse } from '@/services/axios/AxiosHttpClientAdapter'
import { makeEdgeApplicationBaseUrl } from '../edge-application-services/make-edge-application-base-url'

/**
 * @param {Object} payload - The error schema.
 * @param {string } payload.id - The id of edge application.
 * @returns {Promise<string|undefined>} The result message based on the status code.
 */
export const listCacheSettingsService = async ({ id }) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeEdgeApplicationBaseUrl()}/${id}/cache_settings?page_size=200`,
    method: 'GET'
  })
  httpResponse = adapt(httpResponse)

  return parseHttpResponse(httpResponse)
}

const formatCacheSettings = (value) => {
  const CACHE_SETTINGS_OPTIONS = {
    honor: 'Honor Origin Cache Headers',
    override: 'Override Cache Settings',
    'no-cache': 'No Cache'
  }

  return CACHE_SETTINGS_OPTIONS[value]
}

const adapt = (httpResponse) => {
  const parseHttpResponse = httpResponse.body.results.map((cacheSettings) => ({
    id: cacheSettings.id.toString(),
    name: cacheSettings.name,
    browserCache: formatCacheSettings(cacheSettings.browser_cache_settings),
    cdnCache: formatCacheSettings(cacheSettings.cdn_cache_settings)
  }))

  return {
    body: parseHttpResponse,
    statusCode: httpResponse.statusCode
  }
}
