import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeDataStreamingDomainsBaseUrl } from './make-data-streaming-domains-base-url'

export const listDataStreamingDomainsService = async () => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeDataStreamingDomainsBaseUrl()}?page_size=2000`,
    method: 'GET'
  })

  httpResponse = adapt(httpResponse)

  return parseHttpResponse(httpResponse)
}

const adapt = (httpResponse) => {
  const isArray = Array.isArray(httpResponse.body.results)

  const parsedDomains = isArray
    ? httpResponse.body.results.map((domain) => ({
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
