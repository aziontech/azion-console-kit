import { parsePascalToSnake } from '@/helpers/parse-api-body'
import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeAccountIamBaseUrl } from './make-account-base-url'

export const updateAccountSettings = async (payload) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeAccountIamBaseUrl()}`,
    method: 'PATCH',
    body: parsePascalToSnake(payload)
  })

  httpResponse = await adapt(httpResponse)

  return parseHttpResponse(httpResponse)
}

const adapt = async (httpResponse) => {
  if (httpResponse.statusCode !== 200) return httpResponse

  return {
    statusCode: httpResponse.statusCode
  }
}
