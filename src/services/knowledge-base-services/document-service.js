import { AxiosHttpClientAdapter } from '../axios/AxiosHttpClientAdapter'
import { makeKnowledgeBaseBaseUrl } from './make-knowledge-base-base-url'
import * as Errors from '@/services/axios/errors'

export const createDocumentService = async (kbId, payload) => {
  console.log('📄 createDocumentService called with kbId:', kbId, 'payload:', payload)

  const adaptedPayload = adapt(payload)
  const url = `${makeKnowledgeBaseBaseUrl()}/${kbId}/documents`

  // Use cookie-based authentication
  const headers = {
    'Accept': 'application/json',
    'Content-Type': 'multipart/form-data'
  }

  console.log('📝 Document Upload Request Details:')
  console.log('  URL:', url)
  console.log('  Method: POST')
  console.log('  Headers:', headers)
  console.log('  Form Data:', adaptedPayload)

  let httpResponse
  try {
    // For file uploads, we need to use FormData exactly as curl -F flags
    const formData = new FormData()
    formData.append('name', adaptedPayload.name)
    formData.append('type', adaptedPayload.type)
    formData.append('description', adaptedPayload.description)
    formData.append('chunk_strategy', `{"size":${adaptedPayload.chunk_strategy.size}}`)

    if (adaptedPayload.file) {
      formData.append('file', adaptedPayload.file)
    }

    // Create a custom request for file upload
    httpResponse = await AxiosHttpClientAdapter.request({
      url,
      method: 'POST',
      headers: {
        'Accept': 'application/json'
        // Content-Type will be set automatically for FormData
      },
      body: formData
    })

    console.log('✅ Document Upload Response:', httpResponse)
  } catch (error) {
    console.error('❌ Document Upload failed:', error)
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      response: error.response
    })
    throw error
  }

  return parseHttpResponse(httpResponse)
}

export const listDocumentsService = async (kbId) => {
  console.log('📄 listDocumentsService called with kbId:', kbId)

  const url = `${makeKnowledgeBaseBaseUrl()}/${kbId}/documents`

  console.log('📝 Document List Request Details:')
  console.log('  URL:', url)
  console.log('  Method: GET')

  let httpResponse
  try {
    httpResponse = await AxiosHttpClientAdapter.request({
      url,
      method: 'GET'
    })

    console.log('✅ Document List Response:', httpResponse)
  } catch (error) {
    console.error('❌ Document List failed:', error)
    throw error
  }

  return parseHttpResponse(httpResponse)
}

export const deleteDocumentService = async (kbId, documentId) => {
  console.log('📄 deleteDocumentService called with kbId:', kbId, 'documentId:', documentId)

  const url = `${makeKnowledgeBaseBaseUrl()}/${kbId}/documents/${documentId}`

  console.log('📝 Document Delete Request Details:')
  console.log('  URL:', url)
  console.log('  Method: DELETE')

  let httpResponse
  try {
    httpResponse = await AxiosHttpClientAdapter.request({
      url,
      method: 'DELETE'
    })

    console.log('✅ Document Delete Response:', httpResponse)
  } catch (error) {
    console.error('❌ Document Delete failed:', error)
    throw error
  }

  return parseHttpResponse(httpResponse)
}

const adapt = (payload) => {
  console.log('🔧 adapt() called with payload:', payload)

  const adaptedPayload = {
    name: payload?.name,
    type: payload?.type || 'pdf',
    description: payload?.description || '',
    chunk_strategy: {
      size: payload?.chunkSize || 500
    },
    file: payload?.file
  }

  console.log('  🎯 Adapted payload:', adaptedPayload)
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

  switch (httpResponse.statusCode) {
    case 201:
      console.log('✅ 201 Created - Document uploaded successfully!')
      const documentId = httpResponse.body?.document_id || httpResponse.body?.id
      console.log('  Extracted Document ID:', documentId)
      const response201 = {
        feedback: 'Your document has been uploaded successfully',
        documentId: documentId
      }
      console.log('  Returning response:', response201)
      return response201

    case 200:
      console.log('✅ 200 OK - Success!')
      return httpResponse.body

    case 204:
      console.log('✅ 204 No Content - Document deleted successfully!')
      return 'Document deleted successfully'

    case 400:
      console.error('❌ 400 Bad Request')
      throw new Errors.InvalidApiRequestError().message

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