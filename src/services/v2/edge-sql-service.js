export class EdgeSQLService {
  constructor(httpService, EdgeSQLAdapter) {
    this.httpService = httpService
    this.EdgeSQLAdapter = EdgeSQLAdapter
  }

  listDatabases = async ({
    orderBy = 'name',
    sort = 'asc',
    page = 1,
    pageSize = 20,
    search = ''
  } = {}) => {
    const searchParams = new URLSearchParams({
      page: page.toString(),
      page_size: pageSize.toString(),
      ordering: sort === 'desc' ? `-${orderBy}` : orderBy
    })

    if (search) {
      searchParams.set('search', search)
    }

    const httpResponse = await this.httpService.request({
      url: `/v4/edge_sql/databases?${searchParams.toString()}`,
      method: 'GET'
    })

    return this.EdgeSQLAdapter.adaptDatabaseList(httpResponse)
  }

  createDatabase = async ({ name }) => {
    if (!name) {
      throw new Error('Database name is required')
    }

    const httpResponse = await this.httpService.request({
      url: '/v4/edge_sql/databases',
      method: 'POST',
      body: { name }
    })

    const adaptedData = this.EdgeSQLAdapter.adaptDatabaseCreate(httpResponse)
    
    return {
      feedback: `Database "${name}" created successfully`,
      urlToEditView: `/edge-sql/databases/${adaptedData.id}`,
      data: adaptedData,
      statusCode: httpResponse.statusCode || 200,
      shouldMonitor: true,
      databaseName: adaptedData.name
    }
  }

  deleteDatabase = async (id) => {
    if (!id) {
      throw new Error('Database ID is required')
    }

    const httpResponse = await this.httpService.request({
      url: `/v4/edge_sql/databases/${id}`,
      method: 'DELETE'
    })

    return {
      feedback: 'Database deleted successfully',
      statusCode: httpResponse.statusCode || 204
    }
  }

  getDatabase = async (id) => {
    if (!id) {
      throw new Error('Database ID is required')
    }

    const httpResponse = await this.httpService.request({
      url: `/v4/edge_sql/databases/${id}`,
      method: 'GET'
    })

    return this.EdgeSQLAdapter.adaptDatabase(httpResponse)
  }

  checkDatabaseStatus = async (id, fields = null) => {
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

      const httpResponse = await this.httpService.request({
        url,
        method: 'GET'
      })

      return {
        body: this.EdgeSQLAdapter.adaptDatabaseStatus(httpResponse),
        statusCode: httpResponse.statusCode
      }
    } catch (error) {
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

  getTables = async (databaseId) => {
    if (!databaseId) {
      throw new Error('Database ID is required')
    }

    // Use SQL query to get tables from SQLite
    const httpResponse = await this.httpService.request({
      url: `/v4/edge_sql/databases/${databaseId}/query`,
      method: 'POST',
      body: {
        statements: ["SELECT name, type, sql FROM sqlite_master WHERE type IN ('table', 'view') ORDER BY name;"]
      }
    })

    return this.EdgeSQLAdapter.adaptTablesFromQuery(httpResponse)
  }

  queryDatabase = async (databaseId, { statement }) => {
    if (!databaseId) {
      throw new Error('Database ID is required')
    }
    
    if (!statement) {
      throw new Error('SQL statement is required')
    }

    const httpResponse = await this.httpService.request({
      url: `/v4/edge_sql/databases/${databaseId}/query`,
      method: 'POST',
      body: {
        statements: [statement]
      }
    })

    return this.EdgeSQLAdapter.adaptQueryResult(httpResponse)
  }

  executeDatabase = async (databaseId, { statements }) => {
    if (!databaseId) {
      throw new Error('Database ID is required')
    }
    
    if (!statements || !Array.isArray(statements) || statements.length === 0) {
      throw new Error('At least one SQL statement is required')
    }

    const httpResponse = await this.httpService.request({
      url: `/v4/edge_sql/databases/${databaseId}/query`,
      method: 'POST',
      body: { statements }
    })

    return this.EdgeSQLAdapter.adaptExecuteResult(httpResponse)
  }
}