import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeDomainsBaseUrl } from './make-domains-base-url'

export const loadDomainService = async ({ id }) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeDomainsBaseUrl()}/${id}`,
    method: 'GET'
  })

  httpResponse = adapt(httpResponse)

  return parseHttpResponse(httpResponse)
}

const adapt = (httpResponse) => {
  const body = httpResponse.body?.results

  const parsedVariable = {
    id: body?.id,
    name: body?.name,
    domainName: body?.domains[0].domain,
    cnames: body?.alternate_domains.join('\n'),
    cnameAccessOnly: body?.domains[0].allow_access,
    edgeCertificate: body?.tls.certificate ?? 0,
    active: body.active,
    mtlsVerification: body?.mtls.verification,
    mtlsTrustedCertificate: body?.mtls.certificate || undefined,
    environment: body.network_map,
    useHttp3: body.protocols.http.quic_ports !== null,
    useHttps: body.protocols.http.https_ports !== null,
    https_ports: body.protocols.http.https_ports,
    quic_ports: body.protocols.http.quic_ports,
    http_ports: body.protocols.http.https_port,
    supportedCiphers: body.tls.ciphers,
    minimumTlsVersion: body.tls.minimum_version
  }

  return {
    body: parsedVariable,
    statusCode: httpResponse.statusCode
  }
}
