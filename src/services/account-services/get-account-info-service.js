import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeAccountBaseUrl } from './make-account-base-url'

export const getAccountInfoService = async () => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeAccountBaseUrl()}`,
    method: 'GET'
  })

  return parseHttpResponse(httpResponse)
}