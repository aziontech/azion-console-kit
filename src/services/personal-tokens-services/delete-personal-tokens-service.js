import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makePersonalTokensBaseUrl } from './make-personal-tokens-base-url'

export const deletePersonalToken = async (id) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makePersonalTokensBaseUrl()}/${id}`,
    method: 'DELETE'
  })
  return parseHttpResponse(httpResponse)
}
