import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeLoginBaseUrl } from './make-login-base-url'

export const authenticate = async (payload) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeLoginBaseUrl()}`,
    method: 'POST',
    body: payload,
  })

  httpResponse = await adapt(httpResponse)

  return parseHttpResponse(httpResponse)
}

export const verify = async () => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeLoginBaseUrl()}/verify`,
    method: 'POST',
  })

  httpResponse = await adapt(httpResponse)

  return parseHttpResponse(httpResponse)
}

export const refresh = async () => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeLoginBaseUrl()}/refresh`,
    method: 'POST',
  })

  httpResponse = await adapt(httpResponse)

  return parseHttpResponse(httpResponse)
}

export const switchAccount = async (accountId) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeLoginBaseUrl()}/switch-account/${accountId}`,
    method: 'POST',
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
