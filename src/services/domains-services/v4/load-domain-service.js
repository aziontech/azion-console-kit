import { AxiosHttpClientAdapter, parseHttpResponse } from '../../axios/AxiosHttpClientAdapter'
import { makeDomainsBaseUrl } from './make-domains-base-url'

export const loadDomainService = async ({ id }) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeDomainsBaseUrl()}/${id}`,
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

const adapt = (httpResponse) => {
  const body = httpResponse.body?.data

  const parsedVariable = {
    id: body?.id,
    name: body?.name,
    domainName: body?.domains[0].domain,
    cnames: body?.alternate_domains.join('\n'),
    cnameAccessOnly: !body?.domains[0].allow_access,
    domains: body?.domains,
    edgeCertificate: body?.tls.certificate ?? 0,
    active: body.active,
    mtlsVerification: body?.mtls.verification,
    mtlsTrustedCertificate: body?.mtls.certificate || undefined,
    mtlsIsEnabled: body?.mtls.certificate !== null,
    environment: body.network_map,
    useHttp3: body.protocols.http.quic_ports !== null,
    useHttps: body.protocols.http.https_ports !== null,
    httpsPort: handlerHttp(body.protocols.http.https_ports, HTTPS_PORT_LIST_OPTIONS),
    quicPort: handlerHttp(body.protocols.http.quic_ports, HTTP3_PORT_LIST_OPTIONS),
    httpPort: handlerHttp(body.protocols.http.http_ports, HTTP_PORT_LIST_OPTIONS),
    supportedCiphers: body.tls.ciphers,
    minimumTlsVersion: body.tls.minimum_version
  }

  return {
    body: parsedVariable,
    statusCode: httpResponse.statusCode
  }
}
