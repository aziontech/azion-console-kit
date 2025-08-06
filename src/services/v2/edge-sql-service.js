export class EdgeSQLService {
  constructor(httpService, EdgeSQLAdapter) {
    this.httpService = httpService
    this.EdgeSQLAdapter = EdgeSQLAdapter
  }

  /**
   * Standardized error handling for EdgeSQL operations
   * @private
   */
  _handleError(error, operation = 'operation') {
    const statusCode = error.response?.status || error.statusCode || 500
    const errorMessage = error.response?.data?.error || error.message || `Failed to execute ${operation}`
    
    return {
      statusCode,
      error: errorMessage,
      body: null
    }
  }

  /**
   * Standardized success response formatting
   * @private
   */
  _formatSuccessResponse(data, feedback = null, additionalData = {}) {
    return {
      statusCode: 200,
      body: data,
      feedback,
      ...additionalData
    }
  }

  listDatabases = async ({
    orderBy = 'name',
    sort = 'asc',
    page = 1,
    pageSize = 20,
    search = ''
  } = {}) => {
    try {
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

      const adaptedData = this.EdgeSQLAdapter.adaptDatabaseList(httpResponse)
      return this._formatSuccessResponse(adaptedData)
    } catch (error) {
      return this._handleError(error, 'list databases')
    }
  }

  createDatabase = async ({ name }) => {
    try {
      if (!name?.trim()) {
        return this._handleError({ message: 'Database name is required' }, 'create database')
      }

      const httpResponse = await this.httpService.request({
        url: '/v4/edge_sql/databases',
        method: 'POST',
        body: { name: name.trim() }
      })

      const adaptedData = this.EdgeSQLAdapter.adaptDatabaseCreate(httpResponse)

      return this._formatSuccessResponse(adaptedData, `Database "${name}" created successfully`, {
        urlToEditView: `/edge-sql/databases/${adaptedData.id}`,
        shouldMonitor: true,
        databaseId: adaptedData.id,
        databaseName: adaptedData.name,
        statusCode: httpResponse.statusCode || 201
      })
    } catch (error) {
      return this._handleError(error, 'create database')
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
    try {
      if (!id) {
        return this._handleError({ message: 'Database ID is required' }, 'check database status')
      }

      const url = fields
        ? `/v4/edge_sql/databases/${id}?fields=${fields}`
        : `/v4/edge_sql/databases/${id}`

      const httpResponse = await this.httpService.request({
        url,
        method: 'GET'
      })

      const adaptedData = this.EdgeSQLAdapter.adaptDatabaseStatus(httpResponse)
      return this._formatSuccessResponse(adaptedData, null, {
        statusCode: httpResponse.statusCode
      })
    } catch (error) {
      if (error.response?.status === 404 || error.message?.includes('404')) {
        return this._handleError({ message: 'Database not found' }, 'check database status')
      }
      return this._handleError(error, 'check database status')
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
        statements: [
          "SELECT name, type, sql FROM sqlite_master WHERE type IN ('table', 'view') ORDER BY name;"
        ]
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
