import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeUsersBaseUrl } from './make-users-base-url'

export const deleteUsersService = async (userId) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeUsersBaseUrl()}/${userId}`,
    method: 'DELETE'
  })

  return parseHttpResponse(httpResponse)
}
