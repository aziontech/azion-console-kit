import { AxiosHttpClientAdapter } from '../axios/AxiosHttpClientAdapter'
import { makeDomainsBaseUrl } from './make-domains-base-url'
import * as Errors from '@/services/axios/errors'

export const createDomainService = async (payload) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeDomainsBaseUrl()}`,
    method: 'POST',
    body: adapt(payload)
  })

  return parseHttpResponse(httpResponse)
}

const adapt = (payload) => {
  const dataRequest = {
    name: payload.name,
    cnames: payload.cnames.split('\n').filter((item) => item !== ''),
    cname_access_only: payload.cnameAccessOnly,
    edge_application_id: payload.edgeApplication,
    is_mtls_enabled: payload.mtlsIsEnabled,
    is_active: payload.active,
    mtls_verification: payload.mtlsVerification,
    mtls_trusted_ca_certificate_id: payload.mtlsTrustedCertificate
  }

  if (payload.edgeCertificate !== 0) {
    dataRequest.digital_certificate_id = payload.edgeCertificate
  }

  return dataRequest
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
      return {
        feedback: 'Your domain has been created',
        urlToEditView: `/domains/edit/${httpResponse.body.results.id}`,
        domainName: httpResponse.body.results.domain_name
      }
    case 400:
      throw new Error(Object.keys(httpResponse.body)[0]).message
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
