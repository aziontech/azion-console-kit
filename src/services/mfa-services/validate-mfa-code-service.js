import { AxiosHttpClientAdapter } from '../axios/AxiosHttpClientAdapter'
import { makeMfaBaseUrl } from './make-mfa-base-url'
import * as Errors from '@/services/axios/errors'

export const validateMfaCodeService = async (token) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeMfaBaseUrl()}/validate`,
    method: 'POST',
    headers: {
      token: token
    }
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

export const parseHttpResponse = (httpResponse) => {
  switch (httpResponse.statusCode) {
    case 200:
      return httpResponse.body
    case 400:
      const apiErrorInvalidMfaCode = httpResponse.body.detail
      throw new Error(apiErrorInvalidMfaCode).message
    case 401:
      throw new Errors.InvalidApiTokenError().message
    case 403:
      throw new Error('Your session was expired, please login again.').message
    case 404:
      throw new Errors.NotFoundError().message
    case 500:
      throw new Errors.InternalServerError().message
    default:
      throw new Errors.UnexpectedError().message
  }
}
