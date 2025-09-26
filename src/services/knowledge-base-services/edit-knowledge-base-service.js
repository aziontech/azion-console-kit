import { AxiosHttpClientAdapter } from '../axios/AxiosHttpClientAdapter'
import { makeKnowledgeBaseBaseUrl } from './make-knowledge-base-base-url'
import * as Errors from '@/services/axios/errors'

export const editKnowledgeBaseService = async (payload) => {
  const parsedPayload = adapt(payload)
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeKnowledgeBaseBaseUrl()}/${payload.id}`,
    method: 'PUT',
    body: parsedPayload
  })

  return parseHttpResponse(httpResponse)
}

const adapt = (payload) => {
  return {
    name: payload.name,
    description: payload.description,
    category: payload.category,
    content: payload.content
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
    case 200:
      return 'Your knowledge base item has been updated'
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
  const nameError = extractErrorKey(httpResponse.body, 'name')
  const descriptionError = extractErrorKey(httpResponse.body, 'description')
  const categoryError = extractErrorKey(httpResponse.body, 'category')
  const contentError = extractErrorKey(httpResponse.body, 'content')

  const errorMessages = [nameError, descriptionError, categoryError, contentError]
  const errorMessage = errorMessages.find((error) => !!error)
  return errorMessage || 'An error occurred while updating the knowledge base item'
}