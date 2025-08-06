export class EdgeSQLService {
  constructor(httpService, EdgeSQLAdapter) {
    this.httpService = httpService
    this.EdgeSQLAdapter = EdgeSQLAdapter
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
    if (!name?.trim()) {
      throw new Error('Database name is required')
    }

    const httpResponse = await this.httpService.request({
      url: '/v4/edge_sql/databases',
      method: 'POST',
      body: { name: name.trim() }
    })

    const adaptedData = this.EdgeSQLAdapter.adaptDatabaseCreate(httpResponse)

    // Só monitora se status não for final (created/ready)
    const shouldMonitor = adaptedData.status && !['created', 'ready'].includes(adaptedData.status)
    
    return this._formatSuccessResponse(adaptedData, `Database "${name}" created successfully`, {
      shouldMonitor,
      databaseId: adaptedData.id,
      databaseName: adaptedData.name,
      statusCode: httpResponse.statusCode || 201
    })
  }

  deleteDatabase = async (id) => {
    if (!id) {
      throw new Error('Database ID is required')
    }

    const httpResponse = await this.httpService.request({
      url: `/v4/edge_sql/databases/${id}`,
      method: 'DELETE'
    })

    const feedback = this.EdgeSQLAdapter.adaptDatabaseDelete(httpResponse)
    return feedback
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
      throw new Error('Database ID is required')
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
      statusCode: httpResponse.statusCode || 200
    })
  }

  getTables = async (databaseId) => {
    if (!databaseId) {
      throw new Error('Database ID is required')
    }
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
