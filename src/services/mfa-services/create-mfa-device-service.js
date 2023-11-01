import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeMfaBaseUrl } from './make-mfa-base-url'

export const createMfaDeviceService = async () => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeMfaBaseUrl()}/validate`,
    method: 'GET'
  })
  httpResponse = adapt(httpResponse)

  return parseHttpResponse(httpResponse)
}

const adapt = (httpResponse) => {
  console.log(httpResponse)
  const parsedVariable = {}

  return {
    body: parsedVariable,
    statusCode: httpResponse.statusCode
  }
}
