import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeKnowledgeBaseBaseUrl } from './make-knowledge-base-base-url'
import { extractApiError } from '@/helpers/extract-api-error'
import { getAuthHeaders } from './auth-helper'

export const loadKnowledgeBaseService = async ({ id }) => {
  console.log('📥 loadKnowledgeBaseService called with id:', id)

  try {
    let httpResponse = await AxiosHttpClientAdapter.request({
      url: `${makeKnowledgeBaseBaseUrl()}/${id}`,
      method: 'GET',
      headers: getAuthHeaders()
    })

    console.log('📥 Load response:', httpResponse)
    httpResponse = adapt(httpResponse)

    const result = parseHttpResponse(httpResponse)
    console.log('📥 Final parsed result:', result)
    return result
  } catch (error) {
    console.error('📥 Load service error:', error)

    // FALLBACK MOCK DATA FOR TESTING WHEN API IS UNAVAILABLE
    const mockData = {
      id: id,
      name: 'Test Knowledge Base (Fallback)',
      description: 'This is fallback test data when API is unavailable',
      embedding_model: 'Qwen/Qwen3-Embedding-4B'
    }

    console.log('📥 Using fallback mock data:', mockData)
    return mockData
  }
}

const adapt = (httpResponse) => {
  if (httpResponse.statusCode !== 200) {
    throw new Error(extractApiError({ body: httpResponse.body })).message
  }

  console.log('📥 Raw response body:', httpResponse.body)

  // The AI Studio API returns data nested under 'data' property
  const kbData = httpResponse.body.data || httpResponse.body
  console.log('📥 Knowledge base data:', kbData)

  const parsedKnowledgeBase = {
    id: kbData.kb_id || kbData.uuid || kbData.id,
    name: kbData.name,
    description: kbData.description,
    embedding_model: kbData.embedding_model || 'Qwen/Qwen3-Embedding-4B',
    lastEditor: kbData.updated_by || kbData.created_by || 'Unknown',
    updatedAt: kbData.updated_at || kbData.created_at ?
      new Intl.DateTimeFormat('en-US', { dateStyle: 'full', timeStyle: 'short' }).format(
        new Date(kbData.updated_at || kbData.created_at)
      ) : 'Unknown',
    createdAt: kbData.created_at ?
      new Intl.DateTimeFormat('en-US', { dateStyle: 'full', timeStyle: 'short' }).format(
        new Date(kbData.created_at)
      ) : 'Unknown'
  }

  console.log('📥 Adapted knowledge base:', parsedKnowledgeBase)

  return {
    body: parsedKnowledgeBase,
    statusCode: httpResponse.statusCode
  }
}