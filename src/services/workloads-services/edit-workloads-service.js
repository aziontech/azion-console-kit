import { AxiosHttpClientAdapter } from '../axios/AxiosHttpClientAdapter'
import { makeWorkloadsBaseUrl } from './make-workloads-base-url'
import * as Errors from '@/services/axios/errors'
import { extractApiError } from '@/helpers/extract-api-error'

export const editWorkloadService = async (payload) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeWorkloadsBaseUrl()}/${payload.id}`,
    method: 'PATCH',
    body: adapt(payload)
  })

  return parseHttpResponse(httpResponse)
}

const SUPPORTED_VERSIONS = {
  default: ['http1', 'http2'],
  withHttp3: ['http1', 'http2', 'http3']
}

const handleVersions = (useHttp3) =>
  useHttp3 ? SUPPORTED_VERSIONS.withHttp3 : SUPPORTED_VERSIONS.default

const convertPortToInt = (ports) => {
  return ports.map((port) => parseInt(port.value))
}

const adapt = (payload) => {
  if (payload.customHostname) {
    const sufix = '.azion.app'
    payload.domains[0] = `${payload.customHostname}${sufix}`
  } else {
    payload.domains[0] = []
  }

  const dataRequest = {
    name: payload.name,
    alternate_domains: payload.cnames.split('\n').filter((item) => item !== ''),
    active: payload.active,
    tls: {
      minimum_version: null,
      ciphers: null
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
    workload_hostname_allow_access: payload.workloadHostnameAllowAccess,
    domains: payload.domains,
    network_map: payload.environment
  }

  if (!payload.mtlsIsEnabled) {
    delete dataRequest.mtls
  }

  if (payload.edgeCertificate !== 0) {
    dataRequest.tls.certificate = payload.edgeCertificate
  }
  if (payload.supportedCiphers && payload.useHttps) {
    dataRequest.tls.ciphers = payload.supportedCiphers === 'null' ? null : payload.supportedCiphers
  }
  if (payload.minimumTlsVersion && payload.useHttps) {
    dataRequest.tls.minimum_version =
      payload.minimumTlsVersion === 'null' ? null : payload.minimumTlsVersion
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
      return 'Your Workload has been edited'
    case 500:
      throw new Errors.InternalServerError().message
    default:
      throw new Error(extractApiError(httpResponse)).message
  }
}
