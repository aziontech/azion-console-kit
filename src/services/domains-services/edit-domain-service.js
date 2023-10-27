import { AxiosHttpClientAdapter } from '../axios/AxiosHttpClientAdapter'
import getMsgError from './error-msg'
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
    digital_certificate_id: payload.edgeCertificate,
    is_mtls_enabled: payload.mtlsIsEnabled,
    mtls_verification: payload.mtlsVerification,
    mtls_trusted_ca_certificate_id: payload.mtlsTrustedCertificate
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
    case 201:
      return 'Your domain has been created'
    case 400:
      throw new Error(getMsgError(httpResponse))
    case 409:
      throw new Error(getMsgError(httpResponse))
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
