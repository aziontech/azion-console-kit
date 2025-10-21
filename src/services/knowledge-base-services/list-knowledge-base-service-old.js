import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeKnowledgeBaseBaseUrl } from './make-knowledge-base-base-url'

export const listKnowledgeBaseService = async () => {
  try {
    const url = `${makeKnowledgeBaseBaseUrl()}`

    const requestConfig = {
      url: url,
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Token ${import.meta.env.VITE_API_TOKEN}`
      }
    }

    let httpResponse = await AxiosHttpClientAdapter.request(requestConfig)

    // Handle 204 No Content as empty data
    if (httpResponse.statusCode === 204) {
      return []
    }

    httpResponse = adapt(httpResponse)

    return parseHttpResponse(httpResponse)
  } catch (error) {
    // Return empty array directly to prevent DataTable errors
    return []
  }
}

const adapt = (httpResponse) => {
  // Handle the API response format with results array
  // Ensure we always return an empty array if there's no proper data

  if (!httpResponse || !httpResponse.body || typeof httpResponse.body !== 'object') {
    return {
      body: [],
      statusCode: httpResponse?.statusCode || 200
    }
  }

  const results = httpResponse.body.results

  // If results is not an array, return empty array
  if (!Array.isArray(results)) {
    return {
      body: [],
      statusCode: 200
    }
  }

  const parsedKnowledgeBase = results
    .map((item) => {
      // Ensure each item has the required properties
      if (!item || typeof item !== 'object') {
        return null
      }

      return {
        id: item.kb_id || 'unknown',
        name: item.name || 'Unnamed',
        description: item.description || '',
        embeddingModel: {
          content:
            item.embedding_model === 'text-embedding-3-small'
              ? 'text-embedding-3-small'
              : item.embedding_model || 'Unknown',
          icon: 'pi pi-microchip'
        },
        lastEditor: item.updated_by || item.created_by || 'System',
        updatedAt:
          item.updated_at || item.created_at
            ? new Intl.DateTimeFormat('us', { dateStyle: 'full' }).format(
                new Date(item.updated_at || item.created_at)
              )
            : 'Unknown',
        updatedAtDate: item.updated_at || item.created_at || new Date().toISOString()
      }
    })
    .filter(Boolean) // Remove any null entries

  const finalResult = {
    body: Array.isArray(parsedKnowledgeBase) ? parsedKnowledgeBase : [],
    statusCode: 200
    // Note: Not including count so parseHttpResponse returns just the body array
  }

  return finalResult
}
