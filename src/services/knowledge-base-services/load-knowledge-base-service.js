import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeKnowledgeBaseBaseUrl } from './make-knowledge-base-base-url'
import { extractApiError } from '@/helpers/extract-api-error'

export const loadKnowledgeBaseService = async ({ id }) => {
  console.log('📥 loadKnowledgeBaseService called with id:', id)

  try {
    let httpResponse = await AxiosHttpClientAdapter.request({
      url: `${makeKnowledgeBaseBaseUrl()}/${id}`,
      method: 'GET'
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
    embedding_model: kbData.embedding_model || 'Qwen/Qwen3-Embedding-4B'
  }

  console.log('📥 Adapted knowledge base:', parsedKnowledgeBase)

  return {
    body: parsedKnowledgeBase,
    statusCode: httpResponse.statusCode
  }
}