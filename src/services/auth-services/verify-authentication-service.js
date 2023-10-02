import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeAuthTokenBaseUrl } from './make-auth-token-base-url'

export const verifyAuthenticationService = async () => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeAuthTokenBaseUrl()}/verify`,
    method: 'POST'
  })
  return parseHttpResponse(httpResponse)
}