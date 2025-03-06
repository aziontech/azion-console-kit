import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeContractBaseUrl } from './make-contract-base-url'

export const loadProductsListService = async ({ clientId }) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeContractBaseUrl()}/${clientId}/products`,
    method: 'GET'
  })
  const parsedData = adapt(httpResponse)
  return parseHttpResponse(parsedData)
}

const adapt = (httpResponse) => {
  const products = httpResponse.body || []
  const slugs = products?.map((product) => product.slug)

  return {
    body: { slugs },
    statusCode: httpResponse.statusCode
  }
}
