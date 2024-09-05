import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeAuthTokenBaseUrl } from './make-auth-token-base-url'

export const loginService = async (payload) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeAuthTokenBaseUrl()}`,
    method: 'POST',
    body: payload
  })
  // lalala lelele lili
  return parseHttpResponse(httpResponse)
}
