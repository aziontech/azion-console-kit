import { extractApiError } from '@/helpers/extract-api-error'
import * as Errors from '@/services/axios/errors'
import { AxiosHttpClientAdapter } from '../axios/AxiosHttpClientAdapter'
import { getAuthHeaders } from './auth-helper'
import { makeKnowledgeBaseBaseUrl } from './make-knowledge-base-base-url'

export const createKnowledgeBaseService = async (payload) => {
  console.log('🚀 createKnowledgeBaseService called with payload:', payload)

  const adaptedPayload = adapt(payload)
  const url = `${makeKnowledgeBaseBaseUrl()}`

  // Get authentication headers (supports both cookie and token auth)
  const headers = {
    ...getAuthHeaders(),
    'Content-Type': 'application/json'
  }

  console.log('📝 Request Details:')
  console.log('  URL:', url)
  console.log('  Method: POST')
  console.log('  Headers:', headers)
  console.log('  Body (adapted payload):', adaptedPayload)

  let httpResponse
  try {
    httpResponse = await AxiosHttpClientAdapter.request({
      url,
      method: 'POST',
      headers,
      body: adaptedPayload
    })

    console.log('✅ HTTP Response received:', httpResponse)
  } catch (error) {
    console.error('❌ HTTP Request failed:', error)
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      response: error.response
    })
    throw error
  }

  return parseHttpResponse(httpResponse)
}

const adapt = (payload) => {
  console.log('🔧 adapt() called with payload:', payload)
  console.log('  payload type:', typeof payload)
  console.log('  payload keys:', payload ? Object.keys(payload) : 'NO KEYS')
  console.log('  payload.name:', payload?.name)
  console.log('  payload.description:', payload?.description)
  console.log('  payload.embedding_model:', payload?.embedding_model)

  const adaptedPayload = {
    name: payload?.name,
    description: payload?.description,
    embedding_model: payload?.embedding_model || 'text-embedding-3-small'
  }

  console.log('  🎯 Adapted payload:', adaptedPayload)
  console.log('  🎯 Adapted payload stringify:', JSON.stringify(adaptedPayload))

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
  console.log('🔍 parseHttpResponse called with:', httpResponse)
  console.log('📊 Response Details:')
  console.log('  Status Code:', httpResponse.statusCode)
  console.log('  Response Body:', httpResponse.body)
  console.log('  Response Body Type:', typeof httpResponse.body)

  switch (httpResponse.statusCode) {
    case 201:
      console.log('✅ 201 Created - Success!')
      const kbId = httpResponse.body?.kb_id || httpResponse.body?.id
      console.log('  Extracted KB ID:', kbId)
      const response201 = {
        feedback: 'Your Knowledge Base item has been created',
        urlToEditView: kbId ? `/ai/knowledge-base/edit/${kbId}` : '/ai/knowledge-base',
        knowledgeBaseId: kbId
      }
      console.log('  Returning response:', response201)
      return response201

    case 200:
      console.log('✅ 200 OK - Success!')
      const kbId200 = httpResponse.body?.kb_id || httpResponse.body?.id
      console.log('  Extracted KB ID:', kbId200)
      const response200 = {
        feedback: 'Your Knowledge Base item has been created',
        urlToEditView: kbId200 ? `/ai/knowledge-base/edit/${kbId200}` : '/ai/knowledge-base',
        knowledgeBaseId: kbId200
      }
      console.log('  Returning response:', response200)
      return response200

    case 204:
      console.log('✅ 204 No Content - Success!')
      const response204 = {
        feedback: 'Your Knowledge Base item has been created',
        urlToEditView: '/ai/knowledge-base'
      }
      console.log('  Returning response:', response204)
      return response204

    case 400:
      console.error('❌ 400 Bad Request')
      const apiError = extractApiError(httpResponse)
      console.error('  API Error:', apiError)
      throw new Error(apiError).message

    case 401:
      console.error('❌ 401 Unauthorized')
      throw new Errors.InvalidApiTokenError().message

    case 403:
      console.error('❌ 403 Forbidden')
      throw new Errors.PermissionError().message

    case 404:
      console.error('❌ 404 Not Found')
      throw new Errors.NotFoundError().message

    case 500:
      console.error('❌ 500 Internal Server Error')
      throw new Errors.InternalServerError().message

    default:
      console.error('❌ Unexpected Status Code:', httpResponse.statusCode)
      throw new Errors.UnexpectedError().message
  }
}

