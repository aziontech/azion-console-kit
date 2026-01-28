import { AxiosHttpClientAdapter } from '../axios/AxiosHttpClientAdapter'
import { makeDomainsBaseUrl } from './make-domains-base-url'
import { digitalCertificatesService } from '@/services/v2/digital-certificates/digital-certificates-service'
import { buildCertificateNames } from '@/services/utils/domain-names'
import { hasAnyFieldChanged } from '@/services/v2/utils/hasAnyFieldChanged'
import { DigitalCertificatesAdapter } from '@/services/v2/digital-certificates/digital-certificates-adapter'
import { queryClient } from '@/services/v2/base/query/queryClient'
import { queryKeys } from '@/services/v2/base/query/queryKeys'
import * as Errors from '@/services/axios/errors'

const keysToCheck = ['common_name', 'alternative_names']

export const editDomainService = async (payload) => {
  const body = await buildRequestBody(payload)
  const httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeDomainsBaseUrl()}/${payload.id}`,
    method: 'PATCH',
    body
  })

  queryClient.removeQueries({ queryKey: queryKeys.workload.all })

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

const certificateIsWildcard = (subjectName) => {
  if (Array.isArray(subjectName)) {
    return subjectName.some((name) => typeof name === 'string' && name.trim().startsWith('*'))
  }

  if (typeof subjectName === 'string') {
    return subjectName.trim().startsWith('*')
  }

  return false
}

const getWildcardBaseDomains = (subjectName) =>
  (Array.isArray(subjectName) ? subjectName : [subjectName]).reduce((acc, name) => {
    if (typeof name === 'string') {
      const domain = name.trim().slice(1).replace(/^\.+/, '')
      if (name.trim().startsWith('*') && domain) acc.push(domain)
    }
    return acc
  }, [])

const hostnameIsSubdomainOf = (hostname, baseDomain) => {
  if (typeof hostname !== 'string' || typeof baseDomain !== 'string') return false
  const host = hostname.trim().toLowerCase()
  const base = baseDomain.trim().toLowerCase()

  if (!host || !base) return false
  if (!host.endsWith(`.${base}`)) return false

  return host.length > base.length + 1
}

const hasUncoveredHostnamesForWildcard = (subjectName, hostnames) => {
  const bases = getWildcardBaseDomains(subjectName)
  if (!bases.length) return []

  const uncovered = (hostnames || []).filter((hostname) => {
    return !bases.some((base) => hostnameIsSubdomainOf(hostname, base))
  })

  return !uncovered.length
}

const shouldSkipLetsEncryptRecreation = ({ changed, subjectNameCertificate, letEncryptBase }) => {
  if (!changed) return false
  if (!certificateIsWildcard(subjectNameCertificate)) return false

  const hostnames = [
    letEncryptBase.letEncrypt.commonName,
    ...(letEncryptBase.letEncrypt.alternativeNames || [])
  ]

  return hasUncoveredHostnamesForWildcard(subjectNameCertificate, hostnames)
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

    const skipRecreation = shouldSkipLetsEncryptRecreation({
      changed,
      subjectNameCertificate: payload.subjectNameCertificate,
      letEncryptBase
    })

    if (skipRecreation) return null

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
    const { id } = await digitalCertificatesService.createDigitalCertificateLetEncrypt(
      letEncryptBase
    )
    return id
  }

  return null
}

const buildRequestBody = async (payload) => {
  const cnames = splitCnames(payload.cnames)

  const data = {
    name: payload.name,
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
