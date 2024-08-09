import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { makeEdgeApplicationBaseUrl } from '../edge-application-services/make-edge-application-base-url'
import * as Errors from '@/services/axios/errors'

export const editOriginService = async (payload) => {
  const parsedPayload = adapt(payload)
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeEdgeApplicationBaseUrl()}/${payload.edgeApplicationId}/origins/${payload.id}`,
    method: 'PATCH',
    body: parsedPayload
  })

  return parseHttpResponse(httpResponse)
}

const adapt = (payload) => {
  if (payload.originType === 'object_storage') {
    return {
      name: payload.name,
      origin_type: payload.originType,
      bucket: payload.bucketName,
      prefix: payload.prefix.trim() || '/'
    }
  }

  let payloadAdapted = {
    name: payload.name,
    host_header: payload.hostHeader,
    origin_type: payload.originType,
    is_origin_redirection_enabled: payload.isOriginRedirectionEnabled,
    addresses: payload.addresses?.map((addressItem) => {
      const address = {
        address: addressItem.address,
        server_role: addressItem.serverRole,
        is_active: addressItem.isActive
      }
      if (addressItem.weight) {
        address.weight = addressItem.weight
      }
      return address
    }),
    origin_path: payload.originPath,
    origin_protocol_policy: payload.originProtocolPolicy,
    hmac_authentication: payload.hmacAuthentication,
    hmac_region_name: payload.hmacRegionName,
    hmac_access_key: payload.hmacAccessKey,
    hmac_secret_key: payload.hmacSecretKey,
    connection_timeout: payload.connectionTimeout,
    timeout_between_bytes: payload.timeoutBetweenBytes
  }

  if (payload.method) {
    payloadAdapted.method = payload.method
  }

  return payloadAdapted
}

/**
 * @param {Object} errorSchema - The error schema.
 * @param {string} key - The error key of error schema.
 * @returns {Object} An object containing the most specific error key and its message.
 */
const extractErrorKey = (errorSchema, key) => {
  const errorValue = errorSchema[key]
  if (Array.isArray(errorValue)) {
    if (errorValue.length > 0 && typeof errorValue[0] === 'object') {
      return extractErrorKey(errorValue[0], Object.keys(errorValue[0])[0])
    }
    return { key, message: errorValue[0] }
  }
  return { key, message: errorValue }
}

/**
 * @param {Object} httpResponse - The HTTP response object.
 * @param {Object} httpResponse.body - The response body.
 * @returns {string} The result message based on the status code.
 */
const extractApiError = (httpResponse) => {
  for (const key of Object.keys(httpResponse.body)) {
    const { key: innerKey, message } = extractErrorKey(httpResponse.body, key)
    if (message) {
      return `${innerKey}: ${message}`
    }
  }
}

/**
 * @param {Object} httpResponse - The HTTP response object.
 * @param {Object} httpResponse.body - The response body.
 * @param {String} httpResponse.statusCode - The HTTP status code.
 * @returns {string} The result message based on the status code.
 * @throws {Error} If there is an error with the response.
 */
const parseHttpResponse = (httpResponse) => {
  switch (httpResponse.statusCode) {
    case 200:
      return 'Your Origin has been edited'
    case 400:
      const apiError = extractApiError(httpResponse)
      throw new Error(apiError).message
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
