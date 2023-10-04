import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeAccountIamBaseUrl } from './make-account-base-url'

export const updateAccountSettings = async (payload) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeAccountIamBaseUrl}`,
    method: 'PATCH',
    body: payload
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
