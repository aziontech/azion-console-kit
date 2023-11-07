import { AxiosHttpClientAdapter } from '../axios/AxiosHttpClientAdapter'
import { makeMfaBaseUrl } from './make-mfa-base-url'
import * as Errors from '@/services/axios/errors'

export const generateQrCodeService = async () => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeMfaBaseUrl()}/create`,
    method: 'GET'
  })
  httpResponse = adapt(httpResponse)

  return parseHttpResponse(httpResponse)
}

const adapt = (httpResponse) => {
  const parsedVariable = {
    url: httpResponse.body.url
  }

  return {
    body: parsedVariable,
    statusCode: httpResponse.statusCode
  }
}

export const parseHttpResponse = (httpResponse) => {
  switch (httpResponse.statusCode) {
    case 201:
      return httpResponse?.body || null
    case 202:
      return 'Resource successfully updated'
    case 204:
      return 'Resource successfully deleted'
    case 400:
      throw new Errors.InvalidApiRequestError().message
    case 401:
      throw new Errors.InvalidApiTokenError().message
    case 403:
      throw new Errors.PermissionError().message
    case 404:
      throw new Errors.NotFoundError().message
    case 500:
      throw new Errors.InternalServerError().message
    default:
      throw new Errors.UnexpectedError().message
  }
}
