import { AxiosHttpClientAdapter } from '../axios/AxiosHttpClientAdapter'
import { makeDomainsBaseUrl } from './make-domains-base-url'
import { digitalCertificatesService } from '@/services/v2/digital-certificates/digital-certificates-service'
import { buildCertificateNames } from '@/services/utils/domain-names'
import { queryClient } from '@/services/v2/base/query/queryClient'
import { workloadKeys } from '@/services/v2/workload/workload-service'
import * as Errors from '@/services/axios/errors'

export const createDomainService = async (payload) => {
  const body = await buildRequestBody(payload)
  const httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeDomainsBaseUrl()}`,
    method: 'POST',
    body
  })

  queryClient.removeQueries({ queryKey: workloadKeys.lists() })

  return handleHttpResponse(httpResponse)
}

const splitCnames = (cnames) => cnames.split('\n').filter((item) => item !== '')

const resolveCertificateId = async ({ edgeCertificate, name, cnames }) => {
  if (!edgeCertificate || edgeCertificate === 0) return null

  const isLetsEncrypt =
    edgeCertificate === 'lets_encrypt' || edgeCertificate === 'lets_encrypt_http'

  if (!isLetsEncrypt) return edgeCertificate

  const { id } = await digitalCertificatesService.createDigitalCertificateLetEncrypt({
    name,
    letEncrypt: buildCertificateNames(cnames),
    tls: {
      certificate: edgeCertificate === 'lets_encrypt' ? 1 : 2
    }
  })

  return id
}

const buildRequestBody = async (payload) => {
  const cnames = splitCnames(payload.cnames)

  const data = {
    name: payload.name,
    cnames,
    cname_access_only: payload.cnameAccessOnly,
    edge_application_id: payload.edgeApplication,
    is_mtls_enabled: payload.mtlsIsEnabled,
    is_active: payload.active,
    mtls_verification: payload.mtlsVerification,
    mtls_trusted_ca_certificate_id: payload.mtlsTrustedCertificate,
    environment: payload.environment
  }

  if (!payload.mtlsTrustedCertificate || !payload.mtlsIsEnabled) {
    delete data.mtls_trusted_ca_certificate_id
  }

  if (payload.edgeFirewall) {
    data.edge_firewall_id = payload.edgeFirewall
  }

  const digitalCertificateId = await resolveCertificateId({
    edgeCertificate: payload.edgeCertificate,
    name: payload.name,
    cnames
  })

  if (digitalCertificateId) {
    data.digital_certificate_id = digitalCertificateId
  }

  return data
}

/**
 * @param {Object} errorSchema - The error schema.
 * @param {string} key - The error key of error schema.
 * @returns {string|undefined} The result message based on the status code.
 */
const extractErrorKey = (errorSchema, key) => {
  if (typeof errorSchema[key] === 'string') {
    return `${key}: ${errorSchema[key]}`
  }

  if (typeof errorSchema[key] === 'object') {
    const [firstKey] = Object.keys(errorSchema[key])
    return `${firstKey}: ${errorSchema[key][firstKey]}`
  }

  return `${key}: ${errorSchema[key][0]}`
}

/**
 * @param {Object} httpResponse - The HTTP response object.
 * @param {Object} httpResponse.body - The response body.
 * @returns {string} The result message based on the status code.
 */
const extractApiError = (httpResponse) => {
  const [firstKey] = Object.keys(httpResponse.body)
  const errorMessage = extractErrorKey(httpResponse.body, firstKey)

  return errorMessage
}

/**
 * @param {Object} httpResponse - The HTTP response object.
 * @param {Object} httpResponse.body - The response body.
 * @param {String} httpResponse.statusCode - The HTTP status code.
 * @returns {string} The result message based on the status code.
 * @throws {Error} If there is an error with the response.
 */
const handleHttpResponse = (httpResponse) => {
  switch (httpResponse.statusCode) {
    case 201:
      return {
        feedback: 'Your domain has been created',
        urlToEditView: `/domains/edit/${httpResponse.body.results.id}`,
        domainName: httpResponse.body.results.domain_name
      }
    case 400:
      throw new Error(extractApiError(httpResponse))
    case 409:
      throw new Error(extractApiError(httpResponse))
    case 401:
      throw new Errors.InvalidApiTokenError()
    case 403:
      throw new Errors.PermissionError()
    case 404:
      throw new Errors.NotFoundError()
    case 500:
      throw new Errors.InternalServerError()
    default:
      throw new Errors.UnexpectedError()
  }
}
