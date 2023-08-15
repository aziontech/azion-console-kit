import { AxiosHttpClientAdapter, parseHttpResponse } from "../axios/AxiosHttpClientAdapter";
import { makeDomainsBaseUrl } from './make-domains-base-url'
export const listDomainsService = async ({
  orderBy = 'name',
  sort = 'asc',
  page = 1,
  pageSize = 10
}) => {
  let httpResponse = await AxiosHttpClientAdapter
    .request({
      url: `${makeDomainsBaseUrl()}?order_by=${orderBy}&sort=${sort}&page=${page}&page_size=${pageSize}`,
      method: 'GET',
    })

  httpResponse = adapt(httpResponse);

  return parseHttpResponse(httpResponse)
}

const adapt = (httpResponse) => {
  const parsedDomains = httpResponse.body.results.map((domain) => {
    const cnames = domain.cnames.map(cname => cname)?.join(',')
    return {
      id: domain.id,
      domainName: domain.domain_name,
      cnames: cnames,
      edgeApplicationName: domain.name,
      digitalCertificateId: domain.digital_certificate_id,
    }
  })

  return {
    body: parsedDomains,
    statusCode: httpResponse.statusCode,
  }
}