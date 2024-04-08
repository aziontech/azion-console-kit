import { AxiosHttpClientAdapter, parseHttpResponse } from '@/services/axios/AxiosHttpClientAdapter'
import { makeEdgeApplicationBaseUrl } from '../edge-application-services/make-edge-application-base-url'

/**
 * @param {Object} payload - The error schema.
 * @param {string } payload.edgeApplicationId - The id of edge application.
 * @param {string } payload.id - The id of cache settings.
 * @returns {Object} The payload with cache settings content
 */
export const loadCacheSettingsService = async ({ edgeApplicationId, id }) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeEdgeApplicationBaseUrl()}/${edgeApplicationId}/cache_settings/${id}`,
    method: 'GET'
  })
  httpResponse = adapt(httpResponse)

  return parseHttpResponse(httpResponse)
}

const parseContentToTextArea = (content) => {
  return content?.join('\n') || ''
}

const parseDeviceGroups = (deviceGroupsIds) => {
  return deviceGroupsIds?.map((deviceId) => ({ id: deviceId })) || []
}

const adapt = (httpResponse) => {
  const cacheSettings = httpResponse.body.results
  const parseHttpResponse = {
    id: cacheSettings.id,
    name: cacheSettings.name,
    browserCacheSettings: cacheSettings.browser_cache_settings,
    browserCacheSettingsMaximumTtl: cacheSettings.browser_cache_settings_maximum_ttl,
    cdnCacheSettings: cacheSettings.cdn_cache_settings,
    cdnCacheSettingsMaximumTtl: cacheSettings.cdn_cache_settings_maximum_ttl,
    sliceConfigurationEnabled: cacheSettings.is_slice_configuration_enabled,
    sliceConfigurationRange: cacheSettings.slice_configuration_range,
    cacheByQueryString: cacheSettings.cache_by_query_string,
    queryStringFields: parseContentToTextArea(cacheSettings.query_string_fields),
    enableQueryStringSort: cacheSettings.enable_query_string_sort,
    enableCachingForPost: cacheSettings.enable_caching_for_post,
    enableCachingForOptions: cacheSettings.enable_caching_for_options,
    enableStaleCache: cacheSettings.enable_stale_cache,
    cacheByCookies: cacheSettings.cache_by_cookies,
    cookieNames: parseContentToTextArea(cacheSettings.cookie_names),
    adaptiveDeliveryAction: cacheSettings.adaptive_delivery_action,
    deviceGroup: parseDeviceGroups(cacheSettings.device_group),
    l2CachingEnabled: cacheSettings.l2_caching_enabled,
    l2Region: cacheSettings.l2_region,
    isSliceL2CachingEnabled: cacheSettings.is_slice_l2_caching_enabled,
    isSliceEdgeCachingEnabled: cacheSettings.is_slice_edge_caching_enabled
  }

  return {
    body: parseHttpResponse,
    statusCode: httpResponse.statusCode
  }
}
