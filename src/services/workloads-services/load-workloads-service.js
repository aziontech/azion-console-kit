import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeWorkloadsBaseUrl } from './make-workloads-base-url'
import {
  HTTP_PORT_LIST_OPTIONS,
  HTTPS_PORT_LIST_OPTIONS,
  HTTP3_PORT_LIST_OPTIONS
} from '@/helpers/workload-protocol-settings'

export const loadWorkloadService = async ({ id }) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeWorkloadsBaseUrl()}/${id}`,
    method: 'GET'
  })

  httpResponse = adapt(httpResponse)

  return parseHttpResponse(httpResponse)
}

/**
 *
 * @param {Array<number>} ports - The ports
 * @param {Array<Object>} listOptions - The list options
 * @returns {Array<Object>|null} The parsed ports or null
 */
const handlerHttp = (ports, listOptions) => {
  if (!ports) return null

  return ports.map((port) => listOptions.find((option) => option.value === port))
}

function stripAzionDomain(domain) {
  return domain.replace(/\.azion\.app$/, '')
}

const adapt = (httpResponse) => {
  const body = httpResponse.body?.data

  const parsedVariable = {
    id: body?.id,
    name: body?.name,
    workloadHostname: body?.workload_hostname,
    cnames: body?.alternate_domains?.map((domain, index) => {
      const match = domain.match(/^(.+?)\.(.+)$/)
      return {
        id: index + 1,
        subdomain: match ? match[1] : '',
        domain: match ? match[2] : domain
      }
    }),
    workloadHostnameAllowAccess: body?.workload_domain_allow_access,
    customHostname: body?.domains[0] ? stripAzionDomain(body?.domains[0]) : '',
    edgeCertificate: body?.tls.certificate ?? 0,
    active: body.active,
    mtlsVerification: body?.mtls.config.verification,
    mtlsTrustedCertificate: body?.mtls.config.certificate || undefined,
    mtlsIsEnabled: !!body?.mtls?.enabled,
    environment: body.network_map,
    useHttp3: body.protocols.http.quic_ports !== null,
    useHttps: body.protocols.http.https_ports !== null,
    httpsPort: handlerHttp(body.protocols.http.https_ports, HTTPS_PORT_LIST_OPTIONS),
    quicPort: handlerHttp(body.protocols.http.quic_ports, HTTP3_PORT_LIST_OPTIONS),
    httpPort: handlerHttp(body.protocols.http.http_ports, HTTP_PORT_LIST_OPTIONS),
    supportedCiphers: String(body.tls.ciphers),
    minimumTlsVersion: String(body.tls.minimum_version),
    productVersion: body.product_version,
    domains: body.domains
  }

  return {
    body: parsedVariable,
    statusCode: httpResponse.statusCode
  }
}
