import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeWorkloadsBaseUrl } from './make-workloads-base-url'

export const loadWorkloadService = async ({ id }) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeWorkloadsBaseUrl()}/${id}`,
    method: 'GET'
  })

  httpResponse = adapt(httpResponse)

  return parseHttpResponse(httpResponse)
}

// Constants for port list options
const HTTP3_PORT_LIST_OPTIONS = [{ name: '443 (Default)', value: 443 }]

const HTTP_PORT_LIST_OPTIONS = [
  { name: '80 (Default)', value: 80 },
  { name: '8008', value: 8008 },
  { name: '8080', value: 8080 },
  { name: '8880', value: 8880 }
]
const HTTPS_PORT_LIST_OPTIONS = [
  { name: '443 (Default)', value: 443 },
  { name: '8443', value: 8443 },
  { name: '9440', value: 9440 },
  { name: '9441', value: 9441 },
  { name: '9442', value: 9442 },
  { name: '9443', value: 9443 },
  { name: '7777', value: 7777 },
  { name: '8888', value: 8888 },
  { name: '9553', value: 9553 },
  { name: '9653', value: 9653 },
  { name: '8035', value: 8035 },
  { name: '8090', value: 8090 }
]

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
    workloadHostnameAllowAccess: body?.workload_hostname_allow_access,
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
