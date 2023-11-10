import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeRealTimePurgeBaseUrl } from './make-real-time-purge-service'

export const listRealTimePurgeService = async () => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeRealTimePurgeBaseUrl()}`,
    method: 'GET'
  })

  httpResponse = adapt(httpResponse)

  return parseHttpResponse(httpResponse)
}

const adapt = (httpResponse) => {

  return {
    body: httpResponse.body,
    statusCode: httpResponse.statusCode
  }
}
