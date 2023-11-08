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
  let error
  switch (httpResponse.statusCode) {
    case 200:
      return httpResponse.body
    case 400:
      const apiErrorInvalidMfaCode = httpResponse.body.detail
      error = new Error(apiErrorInvalidMfaCode)
      break
    case 401:
      error = new Errors.InvalidApiTokenError()
      break
    case 403:
      error = new Errors.PermissionError()
      break
    case 404:
      error = new Errors.NotFoundError()
      break
    case 500:
      error = new Errors.InternalServerError()
      break
    default:
      error = new Errors.UnexpectedError()
  }
  error.statusCode = httpResponse.statusCode
  throw error
}
