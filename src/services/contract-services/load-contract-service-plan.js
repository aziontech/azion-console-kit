import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeContractBaseUrl } from './make-contract-base-url'

export const loadContractServicePlan = async ({ clientId }) => {
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
  const isDeveloperSupportPlan = slugs.every((slug) => {
    return !slug.includes('plan_') && !slug.includes('support_')
  })

  return {
    body: { isDeveloperSupportPlan },
    statusCode: httpResponse.statusCode
  }
}
