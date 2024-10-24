import { AxiosHttpClientAdapter } from '../axios/AxiosHttpClientAdapter'
import * as Errors from '@/services/axios/errors'
import { makeIdentityProvidersBaseUrl } from './make-identity-providers-base-url'

/**
 * @param {Object} payload - The HTTP request payload.
 * @param {String} payload.name
 * @returns {Promise<string>} The result message based on the status code.
 * @throws {Error} If there is an error with the response.
 */
export const createOIDCIdentityProviderService = async (payload) => {
  const adaptPayload = adapt(payload)
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeIdentityProvidersBaseUrl()}/oidc`,
    method: 'POST',
    body: adaptPayload
  })

  return parseHttpResponse(httpResponse)
}

const adapt = (payload) => {
  const { name, authorizationUrl, userinfoUrl, tokenUrl, clientId, clientSecret, scopes } = payload
  return {
    name,
    authorization_url: authorizationUrl,
    userinfo_url: userinfoUrl,
    token_url: tokenUrl,
    client_id: clientId,
    client_secret: clientSecret,
    scopes
  }
}

/**
 * @param {Object} httpResponse - The HTTP response object.
 * @param {Object} httpResponse.body - The response body.
 * @param {String} httpResponse.statusCode - The HTTP status code.
 * @returns {string} The result message based on the status code.
 * @throws {Error} If there is an error with the response.
 */
const parseHttpResponse = (httpResponse) => {
  switch (httpResponse.statusCode) {
    case 201:
      return {
        feedback: 'Your OIDP has been created',
        id: httpResponse.body.id
      }
    case 400:
      throw new Errors.NotFoundError().message
    case 401:
      throw new Errors.InvalidApiTokenError().message
    case 403:
      throw new Errors.PermissionError().message
    case 404:
      throw new Errors.NotFoundError().message
    case 422:
      const apiError = extractApiError(httpResponse)
      throw new Error(apiError).message
    case 500:
      throw new Errors.InternalServerError().message
    default:
      throw new Errors.UnexpectedError().message
  }
}

/**
 * @param {Object} errorSchema - The error schema.
 * @param {string} key - The error key of error schema.
 * @returns {string|undefined} The result message based on the status code.
 */
const extractErrorKey = (errorSchema, key) => {
  return errorSchema[key]?.[0]
}

/**
 * @param {Object} httpResponse - The HTTP response object.
 * @param {Object} httpResponse.body - The response body.
 * @returns {string} The result message based on the status code.
 */
const extractApiError = (httpResponse) => {
  const nameCantBeEmptyError = extractErrorKey(httpResponse.body, 'errors')

  const errorMessages = [nameCantBeEmptyError]
  const errorMessage = errorMessages.find((error) => !!error)
  return errorMessage
}
