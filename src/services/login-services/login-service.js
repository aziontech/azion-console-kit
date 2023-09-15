import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeLoginBaseUrl } from './make-login-base-url'

export const authenticate = async (payload) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeLoginBaseUrl().token}`,
    method: 'POST',
    body: payload,
  })

  httpResponse = await adapt(httpResponse)

  return parseHttpResponse(httpResponse)
}

export const verify = async () => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeLoginBaseUrl().token}/verify`,
    method: 'POST',
  })

  httpResponse = await adapt(httpResponse)

  return parseHttpResponse(httpResponse)
}

export const refresh = async () => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeLoginBaseUrl().token}/refresh`,
    method: 'POST',
  })

  httpResponse = await adapt(httpResponse)

  return parseHttpResponse(httpResponse)
}

export const switchAccount = async (accountId) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeLoginBaseUrl().switchAccount}/${accountId}`,
    method: 'POST',
  })

  httpResponse = await adapt(httpResponse)

  return parseHttpResponse(httpResponse)
}

export const logout = async () => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeLoginBaseUrl().logout}`,
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
