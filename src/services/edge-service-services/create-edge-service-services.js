import { AxiosHttpClientAdapter } from '../axios/AxiosHttpClientAdapter'
import * as Errors from '@/services/axios/errors'
import { makeEdgeServiceBaseUrl } from './make-edge-service-base-url'

/**
 * @param {Object} payload - The HTTP request payload.
 * @param {String} payload.name
 * @returns {Promise<string>} The result message based on the status code.
 * @throws {Error} If there is an error with the response.
 */
export const createEdgeServiceServices = async (payload) => {
  const adaptPayload = adapt(payload)
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeEdgeServiceBaseUrl()}`,
    method: 'POST',
    body: adaptPayload
  })

  return parseHttpResponse(httpResponse)
}

const parseCodeToVariables = (code) => {
  if (!code) return []
  const lines = code.trim().split(/\r?\n/)

  const mapped = lines.map((line) => {
    const [name, ...rest] = line.split('=')
    const value = rest.join('=')
    return { name: name.trim(), value: value.trim() }
  })

  return mapped
}

const adapt = (payload) => {
  const { active, name, code } = payload
  return {
    active,
    name,
    variables: parseCodeToVariables(code)
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
        feedback: 'Your Edge Service has been created',
        urlToEditView: `/edge-services/edit/${httpResponse.body.id}`,
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
