import { AxiosHttpClientAdapter } from '../axios/AxiosHttpClientAdapter'
import { makeKnowledgeBaseBaseUrl } from './make-knowledge-base-base-url'
import * as Errors from '@/services/axios/errors'
import { extractApiError } from '@/helpers/extract-api-error'
import { getAuthHeaders } from './auth-helper'

export const editKnowledgeBaseService = async (payload) => {
  console.log('🔄 editKnowledgeBaseService called with payload:', payload)

  const parsedPayload = adapt(payload)
  console.log('🔄 Adapted payload for edit:', parsedPayload)

  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeKnowledgeBaseBaseUrl()}/${payload.id}`,
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: parsedPayload
  })

  console.log('🔄 Edit response:', httpResponse)
  return parseHttpResponse(httpResponse)
}

const adapt = (payload) => {
  // In edit mode, only send description since name and embedding_model are read-only
  return {
    description: payload.description
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
    case 204:
      return 'Your knowledge base item has been updated'
    case 400:
      const apiError = getApiError(httpResponse)
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
const getApiError = (httpResponse) => {
  const descriptionError = extractErrorKey(httpResponse.body, 'description')

  return descriptionError || 'An error occurred while updating the knowledge base'
}