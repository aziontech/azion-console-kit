import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeLoginBaseUrl } from './make-login-base-url'

export const loginService = async (payload) => {
  console.log(payload)
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeLoginBaseUrl()}`,
    method: 'POST',
    body: payload
  })

  httpResponse = await adapt(httpResponse)

  return parseHttpResponse(httpResponse)
}

const adapt = async (httpResponse) => {
  const parsedEdgeFirewalls = httpResponse.body

  return {
    body: parsedEdgeFirewalls,
    statusCode: httpResponse.statusCode
  }
}
