import { AxiosHttpClientAdapter, parseHttpResponse } from '@/services/axios/AxiosHttpClientAdapter'
import { makeUsersBaseUrl } from '@/services/users-services/make-users-base-url'

export const loadUserService = async ({ id }) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeUsersBaseUrl()}/${id}?fields=email`,
    method: 'GET'
  })
  httpResponse = adapt(httpResponse)

  return parseHttpResponse(httpResponse)
}

const adapt = (httpResponse) => {
  const responseData = httpResponse.body.data
  const parsedUser = {
    email: responseData.email,
  }

  return {
    body: parsedUser,
    statusCode: httpResponse.statusCode
  }
}
