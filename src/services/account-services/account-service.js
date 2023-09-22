import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeAccountBaseUrl } from './make-account-base-url'

export const getAccountInfo = async () => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeAccountBaseUrl().accountInfo}`,
    method: 'GET'
  })

  httpResponse = await adapt(httpResponse)

  return parseHttpResponse(httpResponse)
}

export const getUserInfo = async () => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeAccountBaseUrl().userInfo}`,
    method: 'GET'
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
