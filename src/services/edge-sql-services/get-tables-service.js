import { AxiosHttpClientAdapter } from '../axios/AxiosHttpClientAdapter'

export const getTablesService = async (databaseId) => {
  if (!databaseId) {
          return {
        body: {
          tables: [],
          count: 0,
          error: 'Database ID is required'
        },
        statusCode: 400,
        error: 'Database ID is required'
      }
  }

  try {
    // Usar query para listar tabelas SQLite
    const httpResponse = await AxiosHttpClientAdapter.request({
      url: `/v4/edge_sql/databases/${databaseId}/query`,
      method: 'POST',
      body: { statements: ["SELECT name FROM sqlite_master WHERE type='table'"] }
    })

    if (httpResponse.statusCode === 200) {
      return {
        body: adapt(httpResponse),
        statusCode: httpResponse.statusCode
      }
    } else {
      throw new Error('Error loading tables')
    }
  } catch (error) {
    return {
      body: {
        tables: [],
        count: 0,
        error: error.message
      },
      statusCode: 500,
      error: error.message
    }
  }
}

const adapt = (httpResponse) => {
  const data = httpResponse.body

  // A API retorna data como array de objetos com results
  // Extrair nomes das tabelas dos resultados
  const tables = data?.data?.[0]?.results?.rows?.map(row => ({
    name: row[0], // Nome da tabela
    type: 'table',
    schema: 'main'
  })) || []

  return {
    tables,
    count: tables.length
  }
} 