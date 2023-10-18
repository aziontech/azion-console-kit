import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeAuthLogoutBaseUrl } from './make-auth-logout-base-url'

export const logoutService = async () => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeAuthLogoutBaseUrl()}`,
    method: 'POST'
  })
  return parseHttpResponse(httpResponse)
}
