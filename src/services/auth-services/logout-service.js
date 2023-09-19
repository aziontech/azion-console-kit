import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeLogoutBaseUrl } from './make-auth-base-url'

export const logout = async () => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeLogoutBaseUrl()}`,
    method: 'POST'
  })

  httpResponse = await adapt(httpResponse)

  return parseHttpResponse(httpResponse)
}

const adapt = async (httpResponse) => {
  const parsedData = httpResponse.body

  return {
    body: parsedData,
    statusCode: httpResponse.statusCode
  }
}
