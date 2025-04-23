import { AxiosHttpClientAdapter, parseHttpResponse } from '@/services/axios/AxiosHttpClientAdapter'
import { makeEdgeApplicationV4BaseUrl } from '@/services/edge-application-services/v4/make-edge-application-v4-base-url'
import { extractApiError } from '@/helpers/extract-api-error'

/**
 * @param {Object} payload - The error schema.
 * @param {string } payload.edgeApplicationId - The id of edge application.
 * @param {string } payload.id - The id of cache settings.
 * @returns {Object} The payload with cache settings content
 */
export const loadCacheSettingsService = async ({ edgeApplicationId, id }) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeEdgeApplicationV4BaseUrl()}/${edgeApplicationId}/cache_settings/${id}`,
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
  if (httpResponse.statusCode !== 200) {
    throw new Error(extractApiError({ body: httpResponse.body })).message
  }

  const cacheSettings = httpResponse.body.data
  const parseHttpResponse = {
    id: cacheSettings.id,
    name: cacheSettings.name,
    browserCacheSettings: cacheSettings.browser_cache.behavior,
    browserCacheSettingsMaximumTtl: cacheSettings.browser_cache.max_age,
    cdnCacheSettings: cacheSettings.edge_cache.behavior,
    cdnCacheSettingsMaximumTtl: cacheSettings.edge_cache.max_age,
    sliceConfigurationEnabled: cacheSettings.slice_controls.slice_configuration_enabled,
    sliceConfigurationRange: cacheSettings.slice_controls.slice_configuration_range,
    cacheByQueryString: cacheSettings.application_controls.cache_by_query_string,
    queryStringFields: parseContentToTextArea(
      cacheSettings.application_controls.query_string_fields
    ),
    enableQueryStringSort: cacheSettings.application_controls.query_string_sort_enabled,
    enableCachingForPost: cacheSettings.edge_cache.caching_for_post_enabled,
    enableCachingForOptions: cacheSettings.edge_cache.caching_for_options_enabled,
    enableStaleCache: cacheSettings.edge_cache.stale_cache_enabled,
    cacheByCookies: cacheSettings.application_controls.cache_by_cookies,
    cookieNames: parseContentToTextArea(cacheSettings.application_controls.cookie_names),
    adaptiveDeliveryAction: cacheSettings.application_controls.adaptive_delivery_action,
    deviceGroup: parseDeviceGroups(cacheSettings.application_controls.device_group),
    l2CachingEnabled: cacheSettings.edge_cache.tiered_cache_enabled,
    l2Region: cacheSettings.edge_cache.tiered_cache_region,
    isSliceL2CachingEnabled: cacheSettings.slice_controls.slice_tiered_caching_enabled,
    isSliceEdgeCachingEnabled: cacheSettings.slice_controls.slice_edge_caching_enabled
  }

  return {
    body: parseHttpResponse,
    statusCode: httpResponse.statusCode
  }
}
