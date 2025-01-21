import { AxiosHttpClientAdapter } from '../../axios/AxiosHttpClientAdapter'
import { makeDomainsBaseUrl } from './make-domains-base-url'
import * as Errors from '@/services/axios/errors'
import { extractApiError } from '@/helpers/extract-api-error'

export const editDomainService = async (payload) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeDomainsBaseUrl()}/${payload.id}`,
    method: 'PATCH',
    body: adapt(payload)
  })

  return parseHttpResponse(httpResponse)
}

const handleVersions = (useHttp3) => {
  if (useHttp3) {
    return ['http1', 'http2', 'http3']
  }

  return ['http1', 'http2']
}

const convertPortToInt = (ports) => {
  return ports.map((port) => parseInt(port.value))
}

const adapt = (payload) => {
  payload.domains[0].allow_access = !payload.cnameAccessOnly
  const domains = payload.domains

  const dataRequest = {
    name: payload.name,
    alternate_domains: payload.cnames.split('\n').filter((item) => item !== ''),
    active: payload.active,
    tls: {
      ciphers: payload.supportedCiphers,
      minimum_version: payload.minimumTlsVersion
    },
    protocols: {
      http: {
        versions: handleVersions(payload.useHttp3),
        http_ports: convertPortToInt(payload.httpPort),
        https_ports: payload.useHttps ? convertPortToInt(payload.httpsPort) : null,
        quic_ports: payload.useHttp3 ? convertPortToInt(payload.quicPort) : null
      }
    },
    mtls: {
      verification: payload.mtlsVerification,
      certificate: payload.mtlsTrustedCertificate
    },
    domains,
    network_map: payload.environment
  }
  if (payload.edgeCertificate !== 0) {
    dataRequest.tls.certificate = payload.edgeCertificate
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
    case 202:
      return 'Your domain has been edited'
    case 500:
      throw new Errors.InternalServerError().message
    default:
      throw new Error(extractApiError(httpResponse)).message
  }
}
