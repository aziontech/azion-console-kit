import { AxiosHttpClientAdapter } from '../axios/AxiosHttpClientAdapter'
import { makeDomainsBaseUrl } from './make-domains-base-url'
import * as Errors from '@/services/axios/errors'

export const editDomainService = async (payload) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeDomainsBaseUrl()}/${payload.id}`,
    method: 'PATCH',
    body: adapt(payload)
  })

  return parseHttpResponse(httpResponse)
}

const adapt = (payload) => {
  return {
    name: payload.name,
    cnames: payload.cnames.split('\n').filter((item) => item !== ''),
    cname_access_only: payload.cnameAccessOnly,
    edge_application_id: payload.edgeApplication,
    edge_firewall_id: payload.edgeFirewall,
    digital_certificate_id: payload.edgeCertificate || null,
    is_mtls_enabled: payload.mtlsIsEnabled,
    is_active: payload.active,
    mtls_verification: payload.mtlsVerification,
    mtls_trusted_ca_certificate_id: payload.mtlsTrustedCertificate
  }
}
/**
 * @param {Object} errorSchema - The error schema.
 * @param {string} key - The error key of error schema.
 * @returns {string|undefined} The result message based on the status code.
 */
const extractErrorKey = (errorSchema, key) => {
  if (Array.isArray(errorSchema[key])) {
    return errorSchema[key]?.[0]
  }
  return errorSchema[key]
}

/**
 * @param {Object} httpResponse - The HTTP response object.
 * @param {Array} httpResponse.body - The response body.
 * @returns {string} The result message based on the status code.
 */
const extractApiError = (httpResponse) => {
  const errorKey = Object.keys(httpResponse.body)[0]
  const apiError = extractErrorKey(httpResponse.body, errorKey)
  return `${errorKey}: ${apiError}`
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
      return 'Your domain has been edited'
    case 400:
      const message = extractApiError(httpResponse)
      throw new Error(message).message
    case 409:
      throw new Error(Object.keys(httpResponse.body)[0]).message
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
