import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeSwitchAccountBaseUrl } from './make-switch-account-base-url'

export const switchAccountService = async (accountId) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeSwitchAccountBaseUrl()}/${accountId}`,
    method: 'POST'
  })

  return parseHttpResponse(httpResponse)
}
