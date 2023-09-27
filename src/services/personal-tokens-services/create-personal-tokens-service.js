import { AxiosHttpClientAdapter } from '../axios/AxiosHttpClientAdapter'
import { makePersonalTokensBaseUrl } from './make-personal-tokens-base-url'

export const createPersonalToken = async (payload) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makePersonalTokensBaseUrl()}`,
    method: 'POST',
    body: payload
  })

  httpResponse = await adapt(httpResponse)

  return httpResponse
}

const adapt = async (httpResponse) => {
  const parsedData = httpResponse.body

  return {
    body: parsedData,
    statusCode: httpResponse.statusCode
  }
}
