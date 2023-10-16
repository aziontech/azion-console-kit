import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeUserInfoBaseUrl } from './make-user-info-base-url'

export const getUserInfoService = async () => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeUserInfoBaseUrl()}`,
    method: 'GET'
  })

  return parseHttpResponse(httpResponse)
}
