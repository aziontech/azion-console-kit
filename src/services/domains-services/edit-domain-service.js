import { AxiosHttpClientAdapter } from '../axios/AxiosHttpClientAdapter'
import { makeDomainsBaseUrl } from './make-domains-base-url'
import { digitalCertificatesService } from '@/services/v2/digital-certificates/digital-certificates-service'
import { buildCertificateNames } from '@/services/utils/domain-names'
import { hasAnyFieldChanged } from '@/services/v2/utils/hasAnyFieldChanged'
import { DigitalCertificatesAdapter } from '@/services/v2/digital-certificates/digital-certificates-adapter'
const keysToCheck = ['common_name', 'alternative_names']
import { queryClient } from '@/services/v2/base/query/queryClient'
import { workloadKeys } from '@/services/v2/workload/workload-service'
import * as Errors from '@/services/axios/errors'
import { sanitizeHtml } from '@/helpers/sanitize-html'

export const editDomainService = async (payload) => {
  const body = await buildRequestBody(payload)
  const httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeDomainsBaseUrl()}/${payload.id}`,
    method: 'PATCH',
    body
  })

  queryClient.removeQueries({ queryKey: workloadKeys.lists() })

  return handleHttpResponse(httpResponse)
}

const splitCnames = (cnames) => cnames.split('\n').filter((item) => item !== '')

const buildLetsEncryptBase = (name, cnames, edgeCertificate) => {
  const { commonName, alternativeNames } = buildCertificateNames(cnames)
  return {
    name,
    letEncrypt: {
      commonName,
      alternativeNames
    },
    tls: {
      certificate: edgeCertificate === 'lets_encrypt' ? 1 : 2
    }
  }
}

const resolveCertificateId = async (payload, cnames) => {
  const edgeCertificate = payload.edgeCertificate

  // If authority is Let's Encrypt, only (re)create when relevant fields change
  if (payload.authorityCertificate === 'lets_encrypt') {
    const letEncryptBase = buildLetsEncryptBase(payload.name, cnames, edgeCertificate)

    let oldTransformed = null
    if (Array.isArray(payload.oldDomains) && payload.oldDomains.length) {
      const oldLetEncryptBase = buildLetsEncryptBase(
        payload.name,
        payload.oldDomains,
        edgeCertificate
      )
      oldTransformed =
        DigitalCertificatesAdapter.transformCreateDigitalCertificateLetEncrypt(oldLetEncryptBase)
    }

    const changed = hasAnyFieldChanged(
      DigitalCertificatesAdapter,
      oldTransformed,
      letEncryptBase,
      keysToCheck
    )

    if (changed) {
      const { id } = await digitalCertificatesService.createDigitalCertificateLetEncrypt(
        letEncryptBase,
        edgeCertificate
      )
      return id
    }

    return null
  }

  if (edgeCertificate === 'lets_encrypt' || edgeCertificate === 'lets_encrypt_http') {
    const letEncryptBase = buildLetsEncryptBase(payload.name, cnames, edgeCertificate)
    const { id } =
      await digitalCertificatesService.createDigitalCertificateLetEncrypt(letEncryptBase)
    return id
  }

  return null
}

const buildRequestBody = async (payload) => {
  const cnames = splitCnames(payload.cnames)

  const data = {
    name: sanitizeHtml(payload.name),
    cnames,
    cname_access_only: payload.cnameAccessOnly,
    edge_application_id: payload.edgeApplication,
    digital_certificate_id: payload.edgeCertificate || null,
    is_mtls_enabled: payload.mtlsIsEnabled,
    is_active: payload.active,
    mtls_verification: payload.mtlsVerification,
    edge_firewall_id: payload.edgeFirewall || null,
    mtls_trusted_ca_certificate_id: payload.mtlsTrustedCertificate
  }

  const newCertificateId = await resolveCertificateId(payload, cnames)
  if (newCertificateId) {
    data.digital_certificate_id = newCertificateId
  }

  if (!payload.mtlsTrustedCertificate || !payload.mtlsIsEnabled) {
    delete data.mtls_trusted_ca_certificate_id
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
 * @param {Array} httpResponse.body - The response body.
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
    case 200:
      return 'Your domain has been edited'
    case 400:
      throw new Error(extractApiError(httpResponse))
    case 409:
      throw new Error(Object.keys(httpResponse.body)[0])
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
