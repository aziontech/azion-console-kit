import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeUsersBaseUrl } from './make-users-base-url'

export const deleteUsersService = async (environmentVariableId) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeUsersBaseUrl()}/${environmentVariableId}`,
    method: 'DELETE'
  })

  return parseHttpResponse(httpResponse)
}
