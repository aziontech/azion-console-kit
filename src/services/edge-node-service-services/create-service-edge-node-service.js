import * as Errors from '@/services/axios/errors'
import { AxiosHttpClientAdapter } from '../axios/AxiosHttpClientAdapter'
import { makeEdgeNodeBaseUrl } from '../edge-node-services/make-edge-node-base-url'

export const createServiceEdgeNodeService = async (payload) => {
  const { id } = payload
  const bodyRequest = adapt(payload)
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeEdgeNodeBaseUrl()}/${id}/services`,
    method: 'POST',
    body: bodyRequest
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
  const variables = parseCodeToVariables(payload.variables)
  return {
    service_id: payload.serviceId,
    variables
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
        feedback: `Service was added to the edge node`,
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
