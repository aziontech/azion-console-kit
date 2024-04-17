import { AxiosHttpClientAdapter } from '../axios/AxiosHttpClientAdapter'
import { makeEdgeApplicationBaseUrl } from '../edge-application-services/make-edge-application-base-url'
import * as Errors from '@/services/axios/errors'

/**
 * @param {Object} payload - The form data to be send to API.
 * @param {string} payload.edgeApplicationId - The cache settings Edge Application id.
 * @returns {Promise<string>|Promise<{feedback:string}>} The result message based on the status code.
 */
export const createCacheSettingsService = async ({ edgeApplicationId, ...payload }) => {
  const parsedBody = adapt(payload)
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeEdgeApplicationBaseUrl()}/${edgeApplicationId}/cache_settings`,
    method: 'POST',
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
  let region = null
  if (payload.l2CachingEnabled) {
    region = payload.l2Region ?? 'na-united-states'
  }

  const requestData = {
    name: payload.name,
    browser_cache_settings: payload.browserCacheSettings,
    browser_cache_settings_maximum_ttl: payload.browserCacheSettingsMaximumTtl,
    cdn_cache_settings: payload.cdnCacheSettings,
    cdn_cache_settings_maximum_ttl: payload.cdnCacheSettingsMaximumTtl,
    is_slice_configuration_enabled: payload.sliceConfigurationEnabled,
    slice_configuration_range: payload.sliceConfigurationRange,
    cache_by_query_string: payload.cacheByQueryString,
    query_string_fields: parseTextContentToArrayByBreaklines(payload.queryStringFields),
    enable_query_string_sort: payload.enableQueryStringSort,
    enable_caching_for_post: payload.enableCachingForPost,
    enable_caching_for_options: payload.enableCachingForOptions,
    enable_stale_cache: payload.enableStaleCache,
    cache_by_cookies: payload.cacheByCookies,
    cookie_names: parseTextContentToArrayByBreaklines(payload.cookieNames),
    adaptive_delivery_action: payload.adaptiveDeliveryAction,
    device_group: parseDeviceGroup(payload.deviceGroup),
    l2_caching_enabled: payload.l2CachingEnabled,
    is_slice_l2_caching_enabled: payload.isSliceL2CachingEnabled,
    is_slice_edge_caching_enabled: payload.isSliceEdgeCachingEnabled
  }

  if (payload.l2CachingEnabled) {
    requestData.l2_region = region
  }

  return requestData
}

/**
 * @param {Object} errorSchema - The error schema.
 * @param {string} key - The error key of error schema.
 * @returns {string} The result message based on the status code.
 */
const extractErrorKey = (errorSchema, key) => {
  return `${errorSchema[key]}`
}

/**
 * @param {Object} httpResponse - The HTTP response object.
 * @param {Object} httpResponse.body - The response body.
 * @returns {string} The result message based on the status code.
 */
const extractApiError = (httpResponse) => {
  const apiKeyError = Object.keys(httpResponse.body)[0]
  const apiValidationError = extractErrorKey(httpResponse.body, apiKeyError)

  return `${apiKeyError}: ${apiValidationError}`
}

/**
 * @param {Object} httpResponse - The HTTP response object.
 * @param {String} httpResponse.statusCode - The HTTP status code.
 * @returns {string} The result message based on the status code.
 * @throws {string} If there is an error with the response.
 */
const parseHttpResponse = (httpResponse) => {
  switch (httpResponse.statusCode) {
    case 201:
      return { feedback: 'Cache Settings successfully created' }
    case 400:
      throw new Error(extractApiError(httpResponse)).message
    case 401:
      throw new Errors.InvalidApiTokenError().message
    case 403:
      throw new Errors.PermissionError().message
    case 404:
      throw new Errors.NotFoundError().message
    case 500:
      throw new Errors.InternalServerError().message
    default:
      throw new Errors.UnexpectedError().message
  }
}
