import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeMarketplaceBaseUrl } from './make-marketplace-base-url'

export const listCategoriesService = async (type = 'onboarding') => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeMarketplaceBaseUrl()}/categories/`,
    method: 'GET',
    headers: {
      'Mktp-Api-Context': type
    }
  })

  return parseHttpResponse(httpResponse)
}
