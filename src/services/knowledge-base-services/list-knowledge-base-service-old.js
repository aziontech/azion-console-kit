import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeKnowledgeBaseBaseUrl } from './make-knowledge-base-base-url'

export const listKnowledgeBaseService = async () => {
  console.log('🔍 listKnowledgeBaseService called!')
  try {
    const url = `${makeKnowledgeBaseBaseUrl()}`
    console.log('Knowledge Base API URL:', url)
    console.log('Full request URL will be:', window.location.origin + '/' + url)

    const requestConfig = {
      url: url,
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Token ${import.meta.env.VITE_API_TOKEN}`
      }
    }

    // Log the equivalent curl command
    const fullUrl = `${window.location.origin}/${url}`
    const token = import.meta.env.VITE_API_TOKEN || 'TOKEN_NOT_SET'
    console.log('📋 Equivalent curl command:')
    console.log(`curl -X GET "${fullUrl}" \\`)
    console.log(`  -H "Accept: application/json" \\`)
    console.log(`  -H "Authorization: Token ${token}"`)
    console.log('')
    console.log('🔗 Direct API endpoint (after proxy):')
    const directApiUrl = `https://stage-ai-studio-api.azion.net/v4/workspace/ai/kb`
    console.log(`curl -X GET "${directApiUrl}" \\`)
    console.log(`  -H "Accept: application/json" \\`)
    console.log(`  -H "Authorization: Token ${token}"`)

    console.log('🔑 Making authenticated request with config:', requestConfig)
    let httpResponse = await AxiosHttpClientAdapter.request(requestConfig)

    // Debug logging to see what we're receiving
    console.log('Knowledge Base API Response:', httpResponse)

    // Handle 204 No Content as empty data
    if (httpResponse.statusCode === 204) {
      console.log('API returned 204 No Content, treating as empty data')
      return []
    }

    httpResponse = adapt(httpResponse)

    return parseHttpResponse(httpResponse)
  } catch (error) {
    console.error('Knowledge Base API Error:', error)
    // Return empty array directly to prevent DataTable errors
    return []
  }
}

const adapt = (httpResponse) => {
  // Handle the API response format with results array
  // Ensure we always return an empty array if there's no proper data
  console.log('Adapting Knowledge Base response:', httpResponse)

  if (!httpResponse || !httpResponse.body || typeof httpResponse.body !== 'object') {
    console.log('Invalid response body, returning empty array')
    return {
      body: [],
      statusCode: httpResponse?.statusCode || 200
    }
  }

  const results = httpResponse.body.results

  // If results is not an array, return empty array
  if (!Array.isArray(results)) {
    console.log('Results is not an array:', results, 'returning empty array')
    return {
      body: [],
      statusCode: 200
    }
  }

  const parsedKnowledgeBase = results.map((item) => {
    // Ensure each item has the required properties
    if (!item || typeof item !== 'object') {
      return null
    }

    return {
      id: item.kb_id || 'unknown',
      name: item.name || 'Unnamed',
      description: item.description || '',
      embeddingModel: {
        content: item.embedding_model === 'text-embedding-3-small' ? 'text-embedding-3-small' : (item.embedding_model || 'Unknown'),
        icon: 'pi pi-microchip'
      },
      lastEditor: item.updated_by || item.created_by || 'System',
      updatedAt: item.updated_at || item.created_at ?
        new Intl.DateTimeFormat('us', { dateStyle: 'full' }).format(
          new Date(item.updated_at || item.created_at)
        ) : 'Unknown',
      updatedAtDate: item.updated_at || item.created_at || new Date().toISOString()
    }
  }).filter(Boolean) // Remove any null entries

  const finalResult = {
    body: Array.isArray(parsedKnowledgeBase) ? parsedKnowledgeBase : [],
    statusCode: 200
    // Note: Not including count so parseHttpResponse returns just the body array
  }

  console.log('Final adapted result:', finalResult)
  return finalResult
}