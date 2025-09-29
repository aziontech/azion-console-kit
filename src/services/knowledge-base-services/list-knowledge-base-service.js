import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeKnowledgeBaseBaseUrl } from './make-knowledge-base-base-url'
import { testApiConnection } from './test-api-connection'

export const listKnowledgeBaseService = async () => {
  console.log('🔍 listKnowledgeBaseService called!')
  
  // Test with simple fetch first to validate API connectivity
  const testResult = await testApiConnection()
  console.log('🧪 Test result:', testResult)
  
  // If fetch worked, try AxiosHttpClientAdapter
  try {
    const url = `${makeKnowledgeBaseBaseUrl()}`
    console.log('🚀 Making request to:', url)
    
    let httpResponse = await AxiosHttpClientAdapter.request({
      url: url,
      method: 'GET'
    })

    console.log('✅ AxiosHttpClientAdapter response:', httpResponse)
    
    // If AxiosHttpClientAdapter failed but fetch worked, use fetch data directly
    if ((httpResponse.statusCode === 204 || !httpResponse.body) && testResult.status === 200) {
      console.log('🔄 Using fetch data as fallback')
      const fetchData = JSON.parse(testResult.body)
      
      // Process the fetch data directly and return the mapped array
      if (fetchData && fetchData.results && Array.isArray(fetchData.results)) {
        const mappedData = fetchData.results.map((item) => {
          return {
            id: item.kb_id || 'unknown',
            name: item.name || 'Unnamed',
            description: item.description || '',
            embeddingModel: {
              content: item.embedding_model === 'Qwen/Qwen3-Embedding-4B' ? 'Qwen3 Embedding 4B' : (item.embedding_model || 'Unknown'),
              icon: 'pi pi-microchip'
            },
            lastEditor: item.updated_by || item.created_by || 'System',
            updatedAt: item.updated_at || item.created_at ? 
              new Intl.DateTimeFormat('us', { dateStyle: 'full' }).format(
                new Date(item.updated_at || item.created_at)
              ) : 'Unknown',
            updatedAtDate: item.updated_at || item.created_at || new Date().toISOString()
          }
        }).filter(Boolean)
        
        console.log('🎯 Returning mapped data from fetch fallback:', mappedData)
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
      console.log('API returned 204 No Content, treating as empty data')
      return {
        body: [],
        count: 0
      }
    }

    httpResponse = adapt(httpResponse)
    const finalResult = parseHttpResponse(httpResponse)
    console.log('🎯 Final result from normal flow:', finalResult)

    // Return in expected format for with-fetch-ordering-and-pagination template
    return {
      body: Array.isArray(finalResult) ? finalResult : [],
      count: Array.isArray(finalResult) ? finalResult.length : 0
    }
  } catch (error) {
    console.log('❌ ERROR - API REQUEST FAILED:', error)
    
    // If there's an error but fetch worked, use fetch data as last resort
    if (testResult.status === 200) {
      console.log('🆘 Using fetch data as error recovery')
      try {
        const fetchData = JSON.parse(testResult.body)
        if (fetchData && fetchData.results && Array.isArray(fetchData.results)) {
          const mappedData = fetchData.results.map((item) => {
            return {
              id: item.kb_id || 'unknown',
              name: item.name || 'Unnamed',
              description: item.description || '',
              embeddingModel: {
                content: item.embedding_model === 'Qwen/Qwen3-Embedding-4B' ? 'Qwen3 Embedding 4B' : (item.embedding_model || 'Unknown'),
                icon: 'pi pi-microchip'
              },
              lastEditor: item.updated_by || item.created_by || 'System',
              updatedAt: item.updated_at || item.created_at ? 
                new Intl.DateTimeFormat('us', { dateStyle: 'full' }).format(
                  new Date(item.updated_at || item.created_at)
                ) : 'Unknown',
              updatedAtDate: item.updated_at || item.created_at || new Date().toISOString()
            }
          }).filter(Boolean)
          
          console.log('🆘 Emergency fallback data:', mappedData)
          return {
            body: mappedData,
            count: mappedData.length
          }
        }
      } catch (parseError) {
        console.log('❌ Failed to parse fetch fallback data:', parseError)
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
  console.log('Adapting Knowledge Base response:', httpResponse)
  
  if (!httpResponse || !httpResponse.body || typeof httpResponse.body !== 'object') {
    console.log('Invalid response body, returning empty array')
    return {
      body: [],
      statusCode: 200
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
        content: item.embedding_model === 'Qwen/Qwen3-Embedding-4B' ? 'Qwen3 Embedding 4B' : (item.embedding_model || 'Unknown'),
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