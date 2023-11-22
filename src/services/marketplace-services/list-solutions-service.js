import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeMarketplaceBaseUrl } from './make-marketplace-base-url'

export const listSolutionsService = async (type = 'onboarding') => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeMarketplaceBaseUrl()}/solution/`,
    method: 'GET',
    headers: {
      'Mktp-Api-Context': type
    }
  })
  httpResponse = adapt(httpResponse)
  return parseHttpResponse(httpResponse)
}

const adapt = (httpResponse) => {
  const isArray = Array.isArray(httpResponse.body)
  const parsedServices =
    isArray && httpResponse.body.length
      ? httpResponse.body.map((element) => ({
          id: element.id,
          name: element.name,
          referenceId: element.solution_reference_id,
          vendor: element.vendor,
          headline: element.headline,
          slug: element.slug
        }))
      : []

  return {
    body: parsedServices,
    statusCode: httpResponse.statusCode
  }
}
