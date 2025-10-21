import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { getAuthHeaders } from './auth-helper'
import { makeKnowledgeBaseBaseUrl } from './make-knowledge-base-base-url'
import { testApiConnection } from './test-api-connection'

export const listKnowledgeBaseService = async () => {
  // Test with simple fetch first to validate API connectivity
  const testResult = await testApiConnection()

  // If fetch worked, try AxiosHttpClientAdapter
  try {
    const url = `${makeKnowledgeBaseBaseUrl()}`

    let httpResponse = await AxiosHttpClientAdapter.request({
      url: url,
      method: 'GET',
      headers: getAuthHeaders(),
      baseURL: ''
    })

    // If AxiosHttpClientAdapter failed but fetch worked, use fetch data directly
    if ((httpResponse.statusCode === 204 || !httpResponse.body) && testResult.status === 200) {
      const fetchData = JSON.parse(testResult.body)

      // Process the fetch data directly and return the mapped array
      if (fetchData && fetchData.results && Array.isArray(fetchData.results)) {
        const mappedData = fetchData.results
          .map((item) => {
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
          .filter(Boolean)

        return {
          body: mappedData,
          count: mappedData.length
        }
      }

      return {
        body: [],
        count: 0
      }
    }

    // Process AxiosHttpClientAdapter response normally
    if (httpResponse.statusCode === 204) {
      return {
        body: [],
        count: 0
      }
    }

    httpResponse = adapt(httpResponse)
    const finalResult = parseHttpResponse(httpResponse)

    // Return in expected format for with-fetch-ordering-and-pagination template
    return {
      body: Array.isArray(finalResult) ? finalResult : [],
      count: Array.isArray(finalResult) ? finalResult.length : 0
    }
  } catch (error) {
    // If there's an error but fetch worked, use fetch data as last resort
    if (testResult.status === 200) {
      try {
        const fetchData = JSON.parse(testResult.body)
        if (fetchData && fetchData.results && Array.isArray(fetchData.results)) {
          const mappedData = fetchData.results
            .map((item) => {
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
            .filter(Boolean)

          return {
            body: mappedData,
            count: mappedData.length
          }
        }
      } catch (parseError) {
        // Failed to parse fallback data
      }
    }

    return {
      body: [],
      count: 0
    }
  }
}

const adapt = (httpResponse) => {
  // Handle the API response format with results array

  if (!httpResponse || !httpResponse.body || typeof httpResponse.body !== 'object') {
    return {
      body: [],
      statusCode: 200
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
