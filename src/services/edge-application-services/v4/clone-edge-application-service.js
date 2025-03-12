import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { makeEdgeApplicationV4BaseUrl } from './make-edge-application-v4-base-url'
import * as Errors from '@/services/axios/errors'

export const cloneEdgeApplicationService = async ({ edgeApplicationName, payload }) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeEdgeApplicationV4BaseUrl()}/${payload.id}/clone`,
    method: 'POST',
    body: adapt(payload, edgeApplicationName)
  })

  return parseHttpResponse(httpResponse)
}

const adapt = (payload, edgeApplicationName) => {
  return {
    id: payload.id,
    name: edgeApplicationName
  }
}

/**
 * @param {Object} errorSchema - The error schema.
 * @param {string} key - The error key of error schema.
 * @returns {string|undefined} The result message based on the status code.
 */
const extractErrorKey = (errorSchema, key) => {
  if (typeof errorSchema[key] === 'string') {
    return `${key}: ${errorSchema[key]}`
  }
  return `${key}: ${errorSchema[key][0]}`
}

/**
 * @param {Object} httpResponse - The HTTP response object.
 * @param {Object} httpResponse.body - The response body.
 * @returns {string} The result message based on the status code.
 */
const extractApiError = (httpResponse) => {
  const [firstKey] = Object.keys(httpResponse.body)
  const errorMessage = extractErrorKey(httpResponse.body, firstKey)

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
  let apiError = null
  switch (httpResponse.statusCode) {
    case 202:
      return {
        feedback: 'Your edge application has been cloned',
        urlToEditView: `/edge-applications/edit/${httpResponse.body.data.id}`,
        applicationId: httpResponse.body.data.id
      }
    case 400:
      apiError = extractApiError(httpResponse)
      throw new Error(apiError).message
    case 409:
      apiError = extractApiError(httpResponse)
      throw new Error(apiError).message
    case 401:
      throw new Errors.InvalidApiTokenError().message
    case 403:
      apiError = extractApiError(httpResponse)
      throw new Error(apiError).message
    case 404:
      throw new Errors.NotFoundError().message
    case 500:
      throw new Errors.InternalServerError().message
    default:
      throw new Errors.UnexpectedError().message
  }
}
