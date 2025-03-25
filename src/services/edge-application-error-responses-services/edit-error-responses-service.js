import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { makeEdgeApplicationErrorResponsesBaseUrl } from './make-edge-application-error-responses-base-url'
import * as Errors from '@/services/axios/errors'

export const editErrorResponsesService = async (payload) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeEdgeApplicationErrorResponsesBaseUrl()}/${
      payload.edgeApplicationId
    }/error_responses/${payload.id}`,
    method: 'PATCH',
    body: adapt(payload)
  })

  return parseHttpResponse(httpResponse)
}

const adapt = (payload) => {
  const errorResponses = []
  payload.errorResponses.forEach((element) => {
    if (element.code === 'any') {
      errorResponses.unshift({
        custom_status_code: element.customStatusCode?.toString() || null,
        uri: element.uri || null,
        timeout: element.timeout,
        code: element.code
      })
    } else {
      errorResponses.push({
        custom_status_code: element.customStatusCode?.toString() || null,
        uri: element.uri || null,
        timeout: element.timeout,
        code: element.code
      })
    }
  })
  
  return {
    origin_id: errorResponses.length === 1 ? null : payload.originId,
    error_responses: errorResponses
  }
}

/**
 * @param {Object} httpResponse - The HTTP response object.
 * @param {Object} httpResponse.body - The response body.
 * @returns {string} The result message based on the status code.
 */
const extractApiError = (httpResponse) => {
  let parsedError
  if (Object.keys(httpResponse.body)[0] === 'error_responses') {
    httpResponse.body.error_responses?.forEach((error) => {
      if (Object.keys(error).length > 0) {
        const errorKey = Object.keys(error)[0]
        parsedError = `${errorKey}: ${error[errorKey][0]}`
        return
      }
    })
  } else {
    const errorKey = Object.keys(httpResponse.body)[0]
    parsedError = `${errorKey}: ${httpResponse.body[errorKey]}`
  }
  return parsedError
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
    case 202:
      return 'Your Error Responses has been edited'
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
