import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeAuthTokenBaseUrl } from './make-auth-token-base-url'

export const refreshAuthenticationService = async () => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeAuthTokenBaseUrl()}/refresh`,
    method: 'POST'
  })
  return parseHttpResponse(httpResponse)
}