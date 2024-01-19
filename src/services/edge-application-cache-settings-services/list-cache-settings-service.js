import { AxiosHttpClientAdapter, parseHttpResponse } from '@/services/axios/AxiosHttpClientAdapter'
import { makeEdgeApplicationBaseUrl } from '../edge-application-services/make-edge-application-base-url'

/**
 * @param {Object} payload - The error schema.
 * @param {string } payload.id - The id of edge application.
 * @returns {Promise<string|undefined>} The result message based on the status code.
 */
export const listCacheSettingsService = async ({ id }) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeEdgeApplicationBaseUrl()}/${id}/cache_settings`,
    method: 'GET'
  })
  httpResponse = adapt(httpResponse)

  return parseHttpResponse(httpResponse)
}

const adapt = (httpResponse) => {
  const parseHttpResponse = httpResponse.body.results.map((cacheSettings) => ({
    id: cacheSettings.id.toString(),
    name: cacheSettings.name,
    browserCache: cacheSettings.browser_cache_settings,
    cdnCache: cacheSettings.cdn_cache_settings
  }))

  return {
    body: parseHttpResponse,
    statusCode: httpResponse.statusCode
  }
}
