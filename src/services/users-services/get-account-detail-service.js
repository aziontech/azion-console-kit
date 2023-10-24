import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeAccountDetailedBaseUrl } from './make-account-detailed-base-url'

export const loadAccountDetailsService = async () => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeAccountDetailedBaseUrl()}`,
    method: 'GET'
  })

  return parseHttpResponse(httpResponse)
}
