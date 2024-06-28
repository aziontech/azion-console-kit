import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeBillingBaseUrl } from './make-billing-base-url'

export const listBillingService = async () => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeBillingBaseUrl()}/`,
    method: 'GET'
  })

  httpResponse = adapt(httpResponse)

  return parseHttpResponse(httpResponse)
}

const adapt = (httpResponse) => {
  /**
   * Necessary until the API gets the common pattern
   * of returning the array of data inside results property
   * like other andpoints.
   */

  const isArray = Array.isArray(httpResponse.body.results)

  const parseBilling = isArray ? httpResponse.body.results.map(() => {}) : []

  return {
    body: parseBilling,
    statusCode: httpResponse.statusCode
  }
}
