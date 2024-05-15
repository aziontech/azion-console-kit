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
    domainName: body?.domain_name,
    cnames: body?.cnames.join('\n'),
    cnameAccessOnly: body?.cname_access_only,
    edgeApplication: body?.edge_application_id,
    edgeCertificate: body?.digital_certificate_id ?? 0,
    mtlsIsEnabled: body?.is_mtls_enabled,
    active: body.is_active,
    mtlsVerification: body?.mtls_verification,
    mtlsTrustedCertificate: body?.mtls_trusted_ca_certificate_id || undefined
  }

  return {
    body: parsedVariable,
    statusCode: httpResponse.statusCode
  }
}
