import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeAccountIamBaseUrl } from './make-account-base-url'

export const deleteAccount = async () => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeAccountIamBaseUrl()}`,
    method: 'DELETE'
  })

  return parseHttpResponse(httpResponse)
}
