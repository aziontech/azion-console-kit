import { BaseService } from '@/services/v2/base/query/baseService'
import { EdgeSQLAdapter } from './edge-sql-adapter'

export class EdgeSQLService extends BaseService {
  constructor() {
    super()
    this.adapter = EdgeSQLAdapter
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
    const { data } = await this.http.request({
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

    const { data } = await this.http.request({
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
    const { data } = await this.http.request({
      url: `${this.baseURL}/${id}`,
      method: 'DELETE'
    })

    const feedback = this.adapter?.adaptDatabaseDelete?.(data)
    return feedback
  }

  getDatabase = async (id) => {
    const { data } = await this.http.request({
      url: `${this.baseURL}/${id}`,
      method: 'GET'
    })

    return this.adapter?.adaptDatabase?.(data)
  }

  checkDatabaseStatus = async (id, fields = null) => {
    const url = fields ? `${this.baseURL}/${id}?fields=${fields}` : `${this.baseURL}/${id}`

    const { data } = await this.http.request({
      url,
      method: 'GET'
    })

    const adaptedData = this.adapter?.adaptDatabaseStatus?.(data)
    return this._formatSuccessResponse(adaptedData, null)
  }

  getTables = async (databaseId) => {
    const { data } = await this.http.request({
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

  getTableInfo = async (databaseId, tableName) => {
    const { data } = await this.http.request({
      url: `${this.baseURL}/${databaseId}/query`,
      method: 'POST',
      body: {
        statements: [`PRAGMA table_info(${tableName});`, `SELECT * FROM ${tableName} LIMIT 100;`]
      }
    })

    const adaptedData = this.adapter?.adaptTableInfo?.(data)
    return {
      count: adaptedData?.rows?.length,
      body: adaptedData
    }
  }

  queryDatabase = async (databaseId, { statements }) => {
    const body = this.adapter?.adaptSqlCommands?.(statements)

    const { data } = await this.http.request({
      url: `${this.baseURL}/${databaseId}/query`,
      method: 'POST',
      body
    })

    const list = Array.isArray(statements) ? statements : [statements]
    const isCountSelect = list
      .filter((query) => typeof query === 'string')
      .some((query) => /^\s*select\s+count\s*\(/i.test(query))

    return this.adapter?.adaptQueryResult?.(data, isCountSelect)
  }

  executeDatabase = async (databaseId, { statements }) => {
    const body = this.adapter?.adaptSqlCommands?.(statements)

    const { data } = await this.http.request({
      url: `${this.baseURL}/${databaseId}/query`,
      method: 'POST',
      body
    })

    // Detect COUNT-only SELECT pattern to adjust columns naming
    const list = Array.isArray(statements) ? statements : [statements]
    const onlySelects = list.filter(
      (query) => typeof query === 'string' && /^\s*select\b/i.test(query)
    )
    const countOnlyRegex = /^\s*select\s+count\s*\(\s*\*\s*\)/i
    const isCountSelect =
      onlySelects.length > 0 && onlySelects.every((query) => countOnlyRegex.test(query))

    return this.adapter?.adaptExecuteResult?.(data, isCountSelect)
  }

  updatedRow = async (databaseId, { tableName, newData, whereData, tableSchema }) => {
    const body = this.adapter?.adaptUpdateRow?.({ tableName, newData, whereData, tableSchema })

    const { data } = await this.http.request({
      url: `${this.baseURL}/${databaseId}/query`,
      method: 'POST',
      body
    })

    return this.adapter?.adaptExecuteResult?.(data)
  }

  insertRow = async (databaseId, { tableName, dataToInsert, tableSchema }) => {
    const body = this.adapter?.adaptInsertRow?.({ tableName, dataToInsert, tableSchema })

    const { data } = await this.http.request({
      url: `${this.baseURL}/${databaseId}/query`,
      method: 'POST',
      body
    })

    return this.adapter?.adaptExecuteResult?.(data)
  }

  insertColumn = async (databaseId, { tableName, columnData }) => {
    const body = this.adapter?.adaptInsertColumn?.({ tableName, columnData })

    const { data } = await this.http.request({
      url: `${this.baseURL}/${databaseId}/query`,
      method: 'POST',
      body
    })

    return this.adapter?.adaptExecuteResult?.(data)
  }

  updateColumn = async (databaseId, { statements }) => {
    const { data } = await this.http.request({
      url: `${this.baseURL}/${databaseId}/query`,
      method: 'POST',
      body: { statements }
    })

    return this.adapter?.adaptExecuteResult?.(data)
  }
}

export const edgeSQLService = new EdgeSQLService()
