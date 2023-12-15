import { AxiosHttpClientAdapter } from '../axios/AxiosHttpClientAdapter'
import * as Errors from '@/services/axios/errors'
import { makeResourcesBaseUrl } from './make-resources-base-url'

export const createResourcesServices = async (payload) => {
  const { id } = payload
  const adaptedPayload = adapt(payload)
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeResourcesBaseUrl()}/${id}/resources`,
    method: 'POST',
    body: adaptedPayload
  })

  return parseHttpResponse(httpResponse)
}

const adapt = (payload) => {
  return {
    trigger: payload.trigger,
    content: payload.content,
    content_type: payload.contentType,
    name: payload.name
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
  const apiValidationErros = extractErrorKey(httpResponse.body, 'errors')

  const errorMessages = [apiValidationErros]
  const errorMessage = errorMessages.find((error) => !!error)

  return errorMessage
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
        feedback: `Resource has been created`,
        resource: httpResponse.body
      }
    case 400:
      const apiError = extractApiError(httpResponse)
      throw new Error(apiError).message
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
