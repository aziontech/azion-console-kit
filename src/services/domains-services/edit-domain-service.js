import { AxiosHttpClientAdapter } from '../axios/AxiosHttpClientAdapter'
import { makeDomainsBaseUrl } from './make-domains-base-url'
import { digitalCertificatesService } from '@/services/v2/digital-certificates/digital-certificates-service'
import { buildCertificateNames } from '@/services/utils/domain-names'
import { hasAnyFieldChanged } from '@/services/v2/utils/hasAnyFieldChanged'
import { DigitalCertificatesAdapter } from '@/services/v2/digital-certificates/digital-certificates-adapter'
const keysToCheck = ['common_name', 'alternative_names']

import * as Errors from '@/services/axios/errors'

export const editDomainService = async (payload) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeDomainsBaseUrl()}/${payload.id}`,
    method: 'PATCH',
    body: await adapt(payload)
  })

  return parseHttpResponse(httpResponse)
}

const adapt = async (payload) => {
  const basePayload = {
    name: payload.name,
    cnames: payload.cnames.split('\n').filter((item) => item !== ''),
    cname_access_only: payload.cnameAccessOnly,
    edge_application_id: payload.edgeApplication,
    digital_certificate_id: payload.edgeCertificate || null,
    is_mtls_enabled: payload.mtlsIsEnabled,
    is_active: payload.active,
    mtls_verification: payload.mtlsVerification,
    edge_firewall_id: payload.edgeFirewall || null,
    mtls_trusted_ca_certificate_id: payload.mtlsTrustedCertificate
  }

  const { commonName, alternativeNames } = buildCertificateNames(
    payload.cnames.split('\n').filter((item) => item !== '')
  )

  const letEncryptBase = {
    name: payload.name,
    letEncrypt: {
      commonName: commonName,
      alternativeNames: alternativeNames
    },
    tls: {
      certificate: payload.edgeCertificate === 'lets_encrypt' ? 1 : 2
    }
  }

  // Build old certificate names (if available) to detect changes
  let oldTransformed = null
  if (Array.isArray(payload.oldDomains) && payload.oldDomains.length) {
    const { commonName: oldCN, alternativeNames: oldSANs } = buildCertificateNames(
      payload.oldDomains
    )
    const oldLetEncryptBase = {
      name: payload.name,
      letEncrypt: {
        commonName: oldCN,
        alternativeNames: oldSANs
      },
      tls: {
        certificate: payload.edgeCertificate === 'lets_encrypt' ? 1 : 2
      }
    }
    oldTransformed =
      DigitalCertificatesAdapter.transformCreateDigitalCertificateLetEncrypt(oldLetEncryptBase)
  }

  if (payload.authorityCertificate === 'lets_encrypt') {
    // Compare previous vs current certificate subject fields
    if (
      hasAnyFieldChanged(DigitalCertificatesAdapter, oldTransformed, letEncryptBase, keysToCheck)
    ) {
      const { id } = await digitalCertificatesService.createDigitalCertificateLetEncrypt(
        letEncryptBase,
        payload.edgeCertificate
      )
      basePayload.digital_certificate_id = id
    }
  } else if (
    payload.edgeCertificate === 'lets_encrypt' ||
    payload.edgeCertificate === 'lets_encrypt_http'
  ) {
    const { id } = await digitalCertificatesService.createDigitalCertificateLetEncrypt(
      letEncryptBase
    )
    basePayload.digital_certificate_id = id
  }

  if (!payload.mtlsTrustedCertificate || !payload.mtlsIsEnabled) {
    delete basePayload.mtls_trusted_ca_certificate_id
  }

  return basePayload
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
