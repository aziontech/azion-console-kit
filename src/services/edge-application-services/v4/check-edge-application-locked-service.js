import { AxiosHttpClientAdapter, parseHttpResponse } from '@/services/axios/AxiosHttpClientAdapter'
import { makeEdgeApplicationV4BaseUrl } from './make-edge-application-v4-base-url'

export const checkgeApplicationsLockedService = async ({ id }) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeEdgeApplicationV4BaseUrl()}/${id}?fields=product_version`,
    method: 'GET'
  })

  httpResponse = adapt(httpResponse)

  return parseHttpResponse(httpResponse)
}

const adapt = (httpResponse) => {
  const data = httpResponse.body?.data

  const LOCKED_VALUE = 'custom'

  const isLocked = data.product_version === LOCKED_VALUE

  return {
    body: isLocked,
    statusCode: httpResponse.statusCode
  }
}
