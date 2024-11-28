import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { makeEdgeApplicationV4BaseUrl } from '@/services/edge-application-services/v4/make-edge-application-v4-base-url'
import * as Errors from '@/services/axios/errors'
import { extractApiError } from '@/helpers/extract-api-error'

/**
 * @param {Object} payload - The form data to be send to API.
 * @param {string} payload.edgeApplicationId - The cache settings Edge Application id.
 * @returns {Promise<string>|Promise<{feedback:string}>} The result message based on the status code.
 */
export const editCacheSettingsService = async ({ edgeApplicationId, ...payload }) => {
  const parsedBody = adapt(payload)
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeEdgeApplicationV4BaseUrl()}/${edgeApplicationId}/cache_settings/${payload.id}`,
    method: 'PUT',
    body: parsedBody
  })

  return parseHttpResponse(httpResponse)
}

/**
 * @param {Array<Object>} deviceGroup - The list of devices.
 * @param {string} deviceGroup.id - The device group id.
 * @returns {Array<string>} - devices to use cache settings
 */
const parseDeviceGroup = (deviceGroup) => {
  const devices = deviceGroup?.map((deviceGroupItem) => deviceGroupItem.id) || []

  return devices
}

const parseTextContentToArrayByBreaklines = (textContent) => {
  if (textContent === '') {
    return []
  }
  return textContent.split('\n')?.map((queryString) => queryString)
}

const adapt = (payload) => {
  return {
    name: payload.name,
    browser_cache: {
      behavior: payload.browserCacheSettings,
      max_age: payload.browserCacheSettingsMaximumTtl
    },
    edge_cache: {
      behavior: payload.cdnCacheSettings,
      max_age: payload.cdnCacheSettingsMaximumTtl,
      caching_for_post_enabled: payload.enableCachingForPost,
      caching_for_options_enabled: payload.enableCachingForOptions,
      stale_cache_enabled: payload.enableStaleCache,
      tiered_cache_enabled: payload.l2CachingEnabled,
      tiered_cache_region: payload.l2CachingEnabled
        ? payload.l2Region ?? 'na-united-states'
        : undefined
    },
    application_controls: {
      cache_by_query_string: payload.cacheByQueryString,
      query_string_fields: parseTextContentToArrayByBreaklines(payload.queryStringFields),
      query_string_sort_enabled: payload.enableQueryStringSort,
      cache_by_cookies: payload.cacheByCookies,
      cookie_names: parseTextContentToArrayByBreaklines(payload.cookieNames),
      adaptive_delivery_action: payload.adaptiveDeliveryAction,
      device_group: parseDeviceGroup(payload.deviceGroup)
    },
    slice_controls: {
      slice_configuration_enabled: payload.sliceConfigurationEnabled,
      slice_edge_caching_enabled: payload.isSliceEdgeCachingEnabled,
      slice_tiered_caching_enabled: payload.isSliceL2CachingEnabled,
      slice_configuration_range: payload.sliceConfigurationRange
    }
  }
}

/**
 * @param {Object} httpResponse - The HTTP response object.
 * @param {Object} httpResponse.body - The response body.
 * @returns {string} The formatted error message.
 */
const parseHttpResponse = (httpResponse) => {
  switch (httpResponse.statusCode) {
    case 200:
      return 'Cache Settings successfully edited'
    case 500:
      throw new Errors.InternalServerError().message
    default:
      throw new Error(extractApiError(httpResponse)).message
  }
}
