import { AxiosHttpClientAdapter } from '../axios/AxiosHttpClientAdapter'

export const queryDatabaseService = async ({ databaseId, query }) => {
  if (!databaseId) {
    return {
      body: {
        state: 'failed',
        results: [],
        error: 'Database ID is required'
      },
      statusCode: 400,
      error: 'Database ID is required'
    }
  }

  if (!query || query.trim().length === 0) {
    return {
      body: {
        state: 'failed',
        results: [],
        error: 'Query is required'
      },
      statusCode: 400,
      error: 'Query is required'
    }
  }

  const statements = Array.isArray(query) ? query : [query.trim()]

  try {
    const httpResponse = await AxiosHttpClientAdapter.request({
      url: `/v4/edge_sql/databases/${databaseId}/query`,
      method: 'POST',
      body: { statements }
    })

    if (httpResponse.statusCode === 200) {
      return {
        body: adapt(httpResponse),
        statusCode: httpResponse.statusCode
      }
    } else {
      throw new Error('Error executing query')
    }
  } catch (error) {
    return {
      body: {
        state: 'failed',
        results: [],
        error: error.message
      },
      statusCode: 500,
      error: error.message
    }
  }
}

const adapt = (httpResponse) => {
  const data = httpResponse.body

  // A API retorna data como array de objetos com results ou error
  const results =
    data?.data?.map((item) => {
      // Se há erro no item, retornar estrutura de erro
      if (item.error) {
        return {
          error: item.error,
          columns: [],
          rows: [],
          statement: null,
          query_duration_ms: null,
          rows_read: null,
          rows_written: null
        }
      }

      // Se há results, processar normalmente
      return {
        columns: item.results?.columns || [],
        rows: item.results?.rows || [],
        statement: item.results?.statement,
        query_duration_ms: item.results?.query_duration_ms,
        rows_read: item.results?.rows_read,
        rows_written: item.results?.rows_written
      }
    }) || []

  return {
    state: data?.state || 'executed',
    results,
    affectedRows:
      results.reduce((total, result) => {
        return total + (result.rows?.length || 0)
      }, 0) || 0
  }
}
