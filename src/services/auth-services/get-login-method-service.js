import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeAuthMethodBaseUrl } from './make-auth-method-base-url'

export const verifyLoginMethodService = async (email) => {
  const emailEncoded = encodeURIComponent(email)
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeAuthMethodBaseUrl()}/login_method?email=${emailEncoded}`,
    method: 'GET'
  })
  return parseHttpResponse(httpResponse)
}
