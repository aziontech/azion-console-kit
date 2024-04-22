import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import * as Errors from '@/services/axios/errors'
import { makePatchFullnameServiceBaseUrl } from './make-patch-fullname-service-base-url'

export const patchFullnameService = async (payload) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: makePatchFullnameServiceBaseUrl(),
    method: 'PATCH',
    body: getNameInfo(payload)
  })
  return parseHttpResponse(httpResponse)
}

const getNameInfo = (fullName) => {
  const [first_name, ...last_name] = fullName.split(' ')
  const nameInfo = { first_name }

  if (last_name.length) {
    nameInfo.last_name = last_name.join(' ')
  }

  return nameInfo
}

const parseErrors = (statusCode) => {
  const errorMap = {
    400: {
      errorMessage: new Errors.InvalidApiRequestError().message,
      errorType: 'field',
      fieldName: 'name'
    },
    403: {
      errorMessage: new Errors.PermissionError().message,
      errorType: 'api',
      fieldName: null
    },
    404: {
      errorMessage: new Errors.NotFoundError().message,
      errorType: 'api',
      fieldName: null
    },
    500: {
      errorMessage: new Errors.InternalServerError().message,
      errorType: 'api',
      fieldName: null
    }
  }

  const defaultError = {
    errorMessage: new Errors.UnexpectedError().message,
    errorType: 'api',
    fieldName: null
  }

  return JSON.stringify(errorMap[statusCode] || defaultError)
}

/**
 * @param {Object} httpResponse - The HTTP response object.
 * @param {Object} httpResponse.body - The response body.
 * @param {String} httpResponse.statusCode - The HTTP status code.
 * @throws {Error} If there is an error with the response.
 */

const parseHttpResponse = (httpResponse) => {
  switch (httpResponse.statusCode) {
    case 200:
      return null
    case 400:
      throw new Error(parseErrors(httpResponse.statusCode)).message
    case 403:
      throw new Error(parseErrors(httpResponse.statusCode)).message
    case 404:
      throw new Error(parseErrors(httpResponse.statusCode)).message
    case 500:
      throw new Error(parseErrors(httpResponse.statusCode)).message
    default:
      throw new Error(parseErrors(httpResponse.statusCode)).message
  }
}
