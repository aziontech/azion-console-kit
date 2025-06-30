import { AxiosHttpClientAdapter } from '../axios/AxiosHttpClientAdapter'

export const getDatabaseService = async (nameOrId) => {
  if (!nameOrId) {
    return {
      body: null,
      statusCode: 400,
      error: 'Database name or ID is required'
    }
  }

  try {
    const httpResponse = await AxiosHttpClientAdapter.request({
      url: `/v4/edge_sql/databases/${nameOrId}`,
      method: 'GET'
    })

    if (httpResponse.statusCode === 200) {
      return {
        body: adapt(httpResponse),
        statusCode: httpResponse.statusCode
      }
    } else {
      throw new Error('Database not found')
    }
  } catch (error) {
    return {
      body: null,
      statusCode: 500,
      error: error.message
    }
  }
}

const adapt = (httpResponse) => {
  // A API pode retornar os dados em httpResponse.body.data ou diretamente em httpResponse.body
  const database = httpResponse.body.data || httpResponse.body

  return {
    id: database.id,
    name: database.name,
    clientId: database.client_id,
    status: database.status,
    createdAt: database.created_at,
    updatedAt: database.updated_at,
    deletedAt: database.deleted_at
  }
} 