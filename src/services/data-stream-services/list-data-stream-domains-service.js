import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeDataStreamDomainsBaseUrl } from './make-data-stream-domains-base-url'

export const listDataStreamDomainsService = async () => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeDataStreamDomainsBaseUrl()}?page_size=2000`,
    method: 'GET'
  })

  httpResponse = adapt(httpResponse)

  return parseHttpResponse(httpResponse)
}

const adapt = (httpResponse) => {
  const isArray = Array.isArray(httpResponse.body.results)

  const parsedDomains = isArray
    ? httpResponse.body.results.map((domain) => ({
        id: domain.domain_id,
        domainID: domain.domain_id,
        name: domain.name,
        selected: domain.selected
      }))
    : []

  return {
    body: parsedDomains,
    statusCode: httpResponse.statusCode
  }
}
