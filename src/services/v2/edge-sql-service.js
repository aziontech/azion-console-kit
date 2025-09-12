export class EdgeSQLService {
  constructor(httpService, adapter) {
    this.httpService = httpService
    this.adapter = adapter
    this.baseURL = 'v4/edge_sql/databases'
  }

  _formatSuccessResponse(data, feedback = null, additionalData = {}) {
    return {
      body: data,
      feedback,
      ...additionalData
    }
  }

  listDatabases = async (
    params = {
      orderBy: 'name',
      sort: 'asc',
      page: 1,
      pageSize: 10,
      search: ''
    }
  ) => {
    const { data } = await this.httpService.request({
      url: this.baseURL,
      method: 'GET',
      params
    })

    const { results, count } = data

    const adaptedData = this.adapter?.adaptDatabaseList?.(results)

    return {
      count,
      body: adaptedData
    }
  }

  createDatabase = async ({ name }) => {
    const body = this.adapter?.adaptDatabaseCreatePayload?.({ name })

    const { data } = await this.httpService.request({
      url: this.baseURL,
      method: 'POST',
      body
    })

    const adaptedData = this.adapter?.adaptDatabaseCreate?.(data)

    const shouldMonitor = adaptedData.status && !['created', 'ready'].includes(adaptedData.status)

    return this._formatSuccessResponse(adaptedData, null, {
      shouldMonitor,
      databaseId: adaptedData.id,
      databaseName: adaptedData.name
    })
  }

  deleteDatabase = async (id) => {
    const { data } = await this.httpService.request({
      url: `${this.baseURL}/${id}`,
      method: 'DELETE'
    })

    const feedback = this.adapter?.adaptDatabaseDelete?.(data)
    return feedback
  }

  getDatabase = async (id) => {
    const { data } = await this.httpService.request({
      url: `${this.baseURL}/${id}`,
      method: 'GET'
    })

    return this.adapter?.adaptDatabase?.(data)
  }

  checkDatabaseStatus = async (id, fields = null) => {
    const url = fields ? `${this.baseURL}/${id}?fields=${fields}` : `${this.baseURL}/${id}`

    const { data } = await this.httpService.request({
      url,
      method: 'GET'
    })

    const adaptedData = this.adapter?.adaptDatabaseStatus?.(data)
    return this._formatSuccessResponse(adaptedData, null)
  }

  getTables = async (databaseId) => {
    const { data } = await this.httpService.request({
      url: `${this.baseURL}/${databaseId}/query`,
      method: 'POST',
      body: {
        statements: [
          "SELECT name, type, sql FROM sqlite_master WHERE type IN ('table', 'view') ORDER BY name;"
        ]
      }
    })

    const adaptedData = this.adapter?.adaptTablesFromQuery?.(data)
    return {
      body: {
        tables: adaptedData
      }
    }
  }

  queryDatabase = async (databaseId, { statements }) => {
    const body = this.adapter?.adaptSqlCommands?.(statements)

    const { data } = await this.httpService.request({
      url: `${this.baseURL}/${databaseId}/query`,
      method: 'POST',
      body
    })

    return this.adapter?.adaptQueryResult?.(data)
  }

  executeDatabase = async (databaseId, { statements }) => {
    const body = this.adapter?.adaptSqlCommands?.(statements)

    const { data } = await this.httpService.request({
      url: `${this.baseURL}/${databaseId}/query`,
      method: 'POST',
      body
    })

    return this.adapter?.adaptExecuteResult?.(data)
  }

  updatedRow = async (databaseId, { tableName, newData, whereData, tableSchema }) => {
    const body = this.adapter?.adaptUpdateRow?.({ tableName, newData, whereData, tableSchema })

    const { data } = await this.httpService.request({
      url: `${this.baseURL}/${databaseId}/query`,
      method: 'POST',
      body
    })

    return this.adapter?.adaptExecuteResult?.(data)
  }

  insertRow = async (databaseId, { tableName, dataToInsert, tableSchema }) => {
    const body = this.adapter?.adaptInsertRow?.({ tableName, dataToInsert, tableSchema })

    const { data } = await this.httpService.request({
      url: `${this.baseURL}/${databaseId}/query`,
      method: 'POST',
      body
    })

    return this.adapter?.adaptExecuteResult?.(data)
  }
}
