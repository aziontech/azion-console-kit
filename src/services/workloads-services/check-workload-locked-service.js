import { AxiosHttpClientAdapter, parseHttpResponse } from '@/services/axios/AxiosHttpClientAdapter'
import { makeWorkloadsBaseUrl } from './make-workloads-base-url'

export const checkWorkloadLockedService = async ({ id }) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeWorkloadsBaseUrl()}/${id}?fields=product_version`,
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
