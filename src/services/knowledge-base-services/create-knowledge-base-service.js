import { extractApiError } from '@/helpers/extract-api-error'
import * as Errors from '@/services/axios/errors'
import { AxiosHttpClientAdapter } from '../axios/AxiosHttpClientAdapter'
import { getAuthHeaders } from './auth-helper'
import { makeKnowledgeBaseBaseUrl } from './make-knowledge-base-base-url'

export const createKnowledgeBaseService = async (payload) => {
  const adaptedPayload = adapt(payload)
  const url = `${makeKnowledgeBaseBaseUrl()}`

  // Get authentication headers (supports both cookie and token auth)
  const headers = {
    ...getAuthHeaders(),
    'Content-Type': 'application/json'
  }

  const httpResponse = await AxiosHttpClientAdapter.request({
    url,
    method: 'POST',
    headers,
    body: adaptedPayload,
    baseURL: ''
  })

  return parseHttpResponse(httpResponse)
}

const adapt = (payload) => {
  const adaptedPayload = {
    name: payload?.name,
    description: payload?.description,
    embedding_model: payload?.embedding_model || 'text-embedding-3-small'
  }

  return adaptedPayload
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
      const kbId = httpResponse.body?.kb_id || httpResponse.body?.id
      const response201 = {
        feedback: 'Your Knowledge Base item has been created',
        urlToEditView: kbId ? `/ai/knowledge-base/edit/${kbId}` : '/ai/knowledge-base',
        knowledgeBaseId: kbId
      }
      return response201

    case 200:
      const kbId200 = httpResponse.body?.kb_id || httpResponse.body?.id
      const response200 = {
        feedback: 'Your Knowledge Base item has been created',
        urlToEditView: kbId200 ? `/ai/knowledge-base/edit/${kbId200}` : '/ai/knowledge-base',
        knowledgeBaseId: kbId200
      }
      return response200

    case 204:
      const response204 = {
        feedback: 'Your Knowledge Base item has been created',
        urlToEditView: '/ai/knowledge-base'
      }
      return response204

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
