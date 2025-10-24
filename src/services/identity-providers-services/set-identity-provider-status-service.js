import { AxiosHttpClientAdapter } from '../axios/AxiosHttpClientAdapter'
import { makeIdentityProvidersBaseUrl } from './make-identity-providers-base-url'
import * as Errors from '@/services/axios/errors'

export const setIdentityProviderStatusService = async (body) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeIdentityProvidersBaseUrl()}/${body.protocol === 'OIDC' ? 'oidc' : 'saml2'}/${
      body.id
    }`,
    method: 'PATCH',
    body: {
      is_active: body.isActive
    }
  })

  return parseHttpResponse(httpResponse)
}

/**
 * @param {Object} body - The response body.
 * @returns {string} The result message based on the status code.
 */
const extractApiError = (body) => {
  let apiError = ''
  const keys = Object.keys(body)

  for (const keyError of keys) {
    if (Array.isArray(body[keyError])) {
      const errorValue = body[keyError][0]
      if (typeof errorValue === 'string') {
        apiError = errorValue
        break
      }
      if (typeof errorValue === 'object') {
        apiError = errorValue.message[0]
        break
      }
    } else {
      apiError = body[keyError]
      break
    }
  }

  return apiError
}

/**
 * @param {Object} httpResponse - The HTTP response object.
 * @param {String} httpResponse.statusCode - The HTTP status code.
 * @returns {string} The result message based on the status code.
 * @throws {Error} If there is an error with the response.
 */
const parseHttpResponse = (httpResponse) => {
  switch (httpResponse.statusCode) {
    case 200:
      return 'Identity Provider successfuly set as active'
    case 400:
      throw new Error(extractApiError(httpResponse.body)).message
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
