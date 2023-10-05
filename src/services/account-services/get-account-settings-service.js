import { parseSnakeToPascal } from '@/helpers/parse-api-body'
import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeAccountIamBaseUrl } from './make-account-base-url'

export const getAccountSettings = async () => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeAccountIamBaseUrl()}`,
    method: 'GET'
  })

  httpResponse = await adapt(httpResponse)

  return parseHttpResponse(httpResponse)
}

const adapt = async (httpResponse) => {
  if (httpResponse.statusCode !== 200) return httpResponse

  const parsedData = parseSnakeToPascal(httpResponse.body)

  return {
    body: parsedData,
    statusCode: httpResponse.statusCode
  }
}
