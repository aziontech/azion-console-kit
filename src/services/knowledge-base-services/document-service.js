import { AxiosHttpClientAdapter } from '../axios/AxiosHttpClientAdapter'
import { makeKnowledgeBaseBaseUrl } from './make-knowledge-base-base-url'
import * as Errors from '@/services/axios/errors'
import { getAuthHeaders } from './auth-helper'

export const createDocumentService = async (kbId, file) => {
  const url = `${makeKnowledgeBaseBaseUrl()}/${kbId}/documents`

  // For file uploads, we need to use FormData with just the file
  const formData = new FormData()
  formData.append('file', file)

  // Get auth headers - for FormData, we must NOT set Content-Type
  // The browser needs to set it automatically with the multipart boundary
  const authHeaders = getAuthHeaders()

  // IMPORTANT: Remove Content-Type so FormData can set it with boundary
  // The makeApi sets a default Content-Type, but FormData needs its own
  const headers = {
    ...authHeaders,
    'Content-Type': undefined // This removes the default Content-Type
  }

  // Create a custom request for file upload
  const httpResponse = await AxiosHttpClientAdapter.request({
    url,
    method: 'POST',
    headers: headers,
    body: formData,
    baseURL: ''
  })

  return parseHttpResponse(httpResponse)
}

export const listDocumentsService = async (kbId) => {
  const url = `${makeKnowledgeBaseBaseUrl()}/${kbId}/documents`

  const httpResponse = await AxiosHttpClientAdapter.request({
    url,
    method: 'GET',
    headers: getAuthHeaders(),
    baseURL: ''
  })

  return parseHttpResponse(httpResponse)
}

export const deleteDocumentService = async (kbId, documentId) => {
  const url = `${makeKnowledgeBaseBaseUrl()}/${kbId}/documents/${documentId}`

  const httpResponse = await AxiosHttpClientAdapter.request({
    url,
    method: 'DELETE',
    headers: getAuthHeaders(),
    baseURL: ''
  })

  return parseHttpResponse(httpResponse)
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
      const documentId = httpResponse.body?.document_id || httpResponse.body?.id
      const response201 = {
        feedback: 'Your document has been uploaded successfully',
        documentId: documentId
      }
      return response201

    case 200:
      // For list operations, extract the results array from the response
      if (httpResponse.body && httpResponse.body.results) {
        return httpResponse.body.results
      }
      // For other operations, return the body as-is
      return httpResponse.body

    case 204:
      return 'Document deleted successfully'

    case 400:
      throw new Errors.InvalidApiRequestError().message

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
