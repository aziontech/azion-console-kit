import { AxiosHttpClientAdapter } from '../axios/AxiosHttpClientAdapter'

/**
 * Serviço para verificar o status de um database específico
 * Usado pelo sistema de polling para monitorar operações pendentes
 */
export const checkDatabaseStatusService = async (id, fields = null) => {
  if (!id) {
    return {
      body: null,
      statusCode: 400,
      error: 'Database ID is required'
    }
  }

  try {
    const url = fields 
      ? `/v4/edge_sql/databases/${id}?fields=${fields}`
      : `/v4/edge_sql/databases/${id}`

    const httpResponse = await AxiosHttpClientAdapter.request({
      url,
      method: 'GET'
    })

    return parseHttpResponse(httpResponse)
  } catch (error) {
    // Capturar erros 404 que indicam database foi deletado
    if (error.response?.status === 404 || error.message?.includes('404')) {
      return {
        body: null,
        statusCode: 404,
        error: 'Database not found'
      }
    }

    return {
      body: null,
      statusCode: 500,
      error: error.message || 'Error checking database status'
    }
  }
}

const parseHttpResponse = (httpResponse) => {
  if (httpResponse.statusCode === 200) {
    return {
      body: adapt(httpResponse),
      statusCode: httpResponse.statusCode
    }
  } else if (httpResponse.statusCode === 404) {
    return {
      body: null,
      statusCode: 404,
      error: 'Database not found'
    }
  } else {
    return {
      body: null,
      statusCode: httpResponse.statusCode || 500,
      error: 'Error checking database status'
    }
  }
}

const adapt = (httpResponse) => {
  const database = httpResponse.body.data || httpResponse.body

  return {
    id: database.id,
    name: database.name,
    clientId: database.client_id,
    status: database.status,
    createdAt: database.created_at,
    updatedAt: database.updated_at,
    deletedAt: database.deleted_at,
    isActive: database.is_active
  }
} 