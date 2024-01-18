import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeDomainsBaseUrl } from './make-domains-base-url'

export const searchDomainsMetricsService = async ({ domainLike }) => {
  const searchParams = makeSearchParams({ domainLike })
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeDomainsBaseUrl()}?${searchParams.toString()}`,
    method: 'GET'
  })

  httpResponse = adapt(httpResponse)

  return parseHttpResponse(httpResponse)
}

const adapt = (httpResponse) => {
  return {
    body: {
      results: httpResponse.results,
      totalPages: httpResponse.totalPages
    },
    statusCode: httpResponse.statusCode
  }
}

const makeSearchParams = ({ domainLike, pageSize = 20 }) => {
  const searchParams = new URLSearchParams()
  searchParams.set('page_size', pageSize)
  searchParams.set('nameLike', domainLike)

  return searchParams
}
