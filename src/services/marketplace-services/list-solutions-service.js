import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeMarketplaceBaseUrl } from './make-marketplace-base-url'

export const listSolutionsService = async () => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeMarketplaceBaseUrl()}/solution/`,
    method: 'GET',
    headers: {
      'Mktp-Api-Context': 'onboarding'
    }
  })
  httpResponse = adapt(httpResponse)
  return parseHttpResponse(httpResponse)
}

const adapt = (httpResponse) => {
  const isArray = Array.isArray(httpResponse.body)
  const service =
    isArray && httpResponse.body.length
      ? httpResponse.body.map((element) => ({
          id: element.bind_id,
          name: element.name,
          referenceId: element.solution_reference_id,
          vendor: element.vendor,
          headline: element.headline
        }))
      : []

  return {
    body: service,
    statusCode: httpResponse.statusCode
  }
}
