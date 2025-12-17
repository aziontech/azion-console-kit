import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makePermissionBaseUrl } from './make-permissions-base-url'

export const listPermissionService = async () => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makePermissionBaseUrl()}?page_size=100`,
    method: 'GET'
  })
  httpResponse = adapt(httpResponse)

  return parseHttpResponse(httpResponse)
}

const adapt = (httpResponse) => {
  return {
    body: [...httpResponse.body.results],
    statusCode: httpResponse.statusCode
  }
}
