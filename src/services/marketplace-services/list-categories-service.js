import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeMarketplaceBaseUrl } from './make-marketplace-base-url'

export const listCategoriesService = async () => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeMarketplaceBaseUrl()}/categories/`,
    method: 'GET'
  })

  httpResponse = adapt(httpResponse)

  return parseHttpResponse(httpResponse)
}

const adapt = (httpResponse) => {
  const results = httpResponse.body || []

  const parsedDomains = results.map((item) => ({
    name: item.name,
    slug: item.slug,
    solutionsCount: item.solutions_count
  }))

  return {
    body: parsedDomains,
    statusCode: httpResponse.statusCode
  }
}
