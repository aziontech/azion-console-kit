import { AxiosHttpClientAdapter } from '../axios/AxiosHttpClientAdapter'
import { makeWorkloadsBaseUrl } from './make-workloads-base-url'
import * as Errors from '@/services/axios/errors'
import { extractApiError } from '@/helpers/extract-api-error'

export const createWorkloadService = async (payload) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeWorkloadsBaseUrl()}`,
    method: 'POST',
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
  const domains = []

  if (payload.customHostname) {
    const sufix = '.azion.app'
    domains.push(`${payload.customHostname}${sufix}`)
  }

  const dataRequest = {
    name: payload.name,
    alternate_domains: payload.cnames.split('\n').filter((item) => item !== ''),
    edge_application: payload.edgeApplication,
    edge_firewall: payload.edgeFirewall,
    active: payload.active,
    workload_hostname_allow_access: payload.workloadHostnameAllowAccess,
    mtls: {
      verification: payload.mtlsVerification,
      certificate: payload.mtlsTrustedCertificate
    },
    protocols: {
      http: {
        versions: handleVersions(payload.useHttp3),
        http_ports: convertPortToInt(payload.httpPort),
        https_ports: payload.useHttps ? convertPortToInt(payload.httpsPort) : null,
        quic_ports: payload.useHttp3 ? convertPortToInt(payload.quicPort) : null
      }
    },
    domains,
    network_map: payload.environment,
    tls: {
      minimum_version: null
    }
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
      return {
        feedback: 'Your workload has been created',
        urlToEditView: `/workloads/edit/${httpResponse.body.data.id}`,
        domainName: httpResponse.body.data.workload_hostname,
        id: parseInt(httpResponse.body.data.id)
      }
    case 500:
      throw new Errors.InternalServerError().message
    default:
      throw new Error(extractApiError(httpResponse)).message
  }
}
