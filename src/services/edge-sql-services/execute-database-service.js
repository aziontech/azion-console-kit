import { AxiosHttpClientAdapter } from '../axios/AxiosHttpClientAdapter'

export const executeDatabaseService = async ({ databaseId, statements }) => {
  if (!databaseId) {
    return {
      body: {
        state: 'failed',
        results: [],
        error: 'Database ID is required',
        affectedRows: 0
      },
      statusCode: 400,
      error: 'Database ID is required'
    }
  }

  if (!statements || (Array.isArray(statements) && statements.length === 0)) {
    return {
      body: {
        state: 'failed',
        results: [],
        error: 'Statements are required',
        affectedRows: 0
      },
      statusCode: 400,
      error: 'Statements are required'
    }
  }

  const sqlStatements = Array.isArray(statements) ? statements : [statements]

  try {
    const httpResponse = await AxiosHttpClientAdapter.request({
      url: `/v4/edge_sql/databases/${databaseId}/query`,
      method: 'POST',
      body: { statements: sqlStatements }
    })

    if (httpResponse.statusCode === 200) {
      return {
        body: adapt(httpResponse),
        statusCode: httpResponse.statusCode
      }
    } else {
      throw new Error('Error executing statements')
    }
  } catch (error) {
    return {
      body: {
        state: 'failed',
        results: [],
        error: error.message,
        affectedRows: 0
      },
      statusCode: 500,
      error: error.message
    }
  }
}

const adapt = (httpResponse) => {
  const data = httpResponse.body

  // A API retorna data como array de objetos com results ou error
  const results = data?.data?.map(item => {
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
    affectedRows: results.reduce((total, result) => {
      return total + (result.rows?.length || 0)
    }, 0) || 0
  }
} 