/* eslint-disable no-console */
import { BaseService } from '@/services/v2/base/query/baseService'
import { EdgeSQLAdapter } from './edge-sql-adapter'
import { extractAffectedTableNames } from '../utils/statement-utils'

export class EdgeSQLService extends BaseService {
  constructor() {
    super()
    this.adapter = EdgeSQLAdapter
    this.baseURL = 'v4/edge_sql/databases'
    this.SCHEMA_CACHE_TTL_MS = 5 * 60 * 60 * 1000 // 5 hours
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
    // Warm schema cache for all tables in a single batched request (best-effort, non-blocking)
    try {
      const tables = Array.isArray(adaptedData) ? adaptedData : []
      const onlyTables = tables
        .filter((table) => (table?.type || 'table').toLowerCase() === 'table')
        .map((table) => table?.name)
        .filter(Boolean)
      if (onlyTables.length) {
        Promise.resolve().then(async () => {
          try {
            await this._refreshAllSchemasCache(databaseId, onlyTables)
          } catch {
            console.error('Failed to refresh schema cache')
          }
        })
      }
    } catch {
      console.error('Failed to refresh schema cache')
    }
    return {
      body: {
        tables: adaptedData
      }
    }
  }

  getTableInfo = async (databaseId, tableName) => {
    const cachedSchema = this._getSchemaCache(databaseId, tableName)
    const needSchema = cachedSchema == null
    const statements = this.adapter?.buildTableInfoStatements?.(tableName, needSchema)

    const { data } = await this.http.request({
      url: `${this.baseURL}/${databaseId}/query`,
      method: 'POST',
      body: { statements }
    })

    if (needSchema) {
      const adapted = await this._adaptTableInfoWithCache(databaseId, tableName, data)
      return { count: adapted?.rows?.length, body: adapted }
    }

    const adapted = this._adaptTableInfoFromCache(cachedSchema, data)
    return { count: adapted?.rows?.length, body: adapted }
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

    const result = this.adapter?.adaptQueryResult?.(data, isCountSelect)
    // Detect schema mutations and refresh cache
    try {
      const affected = extractAffectedTableNames(statements)
      for (const item of affected) {
        if (item.action === 'drop') {
          this._invalidateSchemaCache(databaseId, item.table)
        } else {
          await this._refreshSchemaCache(databaseId, item.table)
        }
      }
    } catch {
      // eslint-disable-next-line no-console
      console.error('Failed to refresh schema cache')
    }
    return result
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

    const result = this.adapter?.adaptExecuteResult?.(data, isCountSelect)
    // Detect schema mutations and refresh cache
    try {
      const affected = this._extractAffectedTableNames(statements)
      for (const item of affected) {
        if (item.action === 'drop') {
          this._invalidateSchemaCache(databaseId, item.table)
        } else {
          await this._refreshSchemaCache(databaseId, item.table)
        }
      }
    } catch {
      console.error('Failed to refresh schema cache')
    }
    return result
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

    const adapted = this.adapter?.adaptExecuteResult?.(data)
    try {
      await this._refreshSchemaCache(databaseId, tableName)
    } catch {
      console.error('Failed to refresh schema cache')
    }
    return adapted
  }

  updateColumn = async (databaseId, { statements }) => {
    const { data } = await this.http.request({
      url: `${this.baseURL}/${databaseId}/query`,
      method: 'POST',
      body: { statements }
    })

    const adapted = this.adapter?.adaptExecuteResult?.(data)
    try {
      const affected = extractAffectedTableNames(statements)
      for (const item of affected) {
        if (item.action === 'drop') this._invalidateSchemaCache(databaseId, item.table)
        else await this._refreshSchemaCache(databaseId, item.table)
      }
    } catch {
      console.error('Failed to refresh schema cache')
    }
    return adapted
  }

  // ===== Schema cache helpers =====
  _schemaCacheKey(databaseId, tableName) {
    return `edgeSql:schema:${databaseId}:${tableName}`
  }
  _getSchemaCache(databaseId, tableName) {
    try {
      const key = this._schemaCacheKey(databaseId, tableName)
      const raw = localStorage.getItem(key)
      if (!raw) return null
      const parsed = JSON.parse(raw)
      if (!parsed || typeof parsed !== 'object') return null
      const now = Date.now()
      if (parsed.expiresAt && now < parsed.expiresAt) {
        return parsed.schema || null
      }
      localStorage.removeItem(key)
      return null
    } catch {
      return null
    }
  }
  async _setSchemaCache(databaseId, tableName, schema) {
    try {
      const key = this._schemaCacheKey(databaseId, tableName)
      const payload = {
        schema,
        expiresAt: Date.now() + this.SCHEMA_CACHE_TTL_MS
      }
      localStorage.setItem(key, JSON.stringify(payload))
    } catch {
      console.error('Failed to set schema cache')
    }
  }
  _invalidateSchemaCache(databaseId, tableName) {
    try {
      const key = this._schemaCacheKey(databaseId, tableName)
      localStorage.removeItem(key)
    } catch {
      console.error('Failed to invalidate schema cache')
    }
  }
  async _refreshSchemaCache(databaseId, tableName) {
    // Fetch latest table schema for a single table using PRAGMA and cache
    await this._refreshAllSchemasCache(databaseId, [tableName])
    return this._getSchemaCache(databaseId, tableName) || []
  }
  async _refreshAllSchemasCache(databaseId, tableNames) {
    try {
      const safeNames = Array.isArray(tableNames) ? tableNames.filter(Boolean) : []
      if (!safeNames.length) return
      const statements = safeNames.map((name) => `PRAGMA table_info("${name}");`)
      const { data } = await this.http.request({
        url: `${this.baseURL}/${databaseId}/query`,
        method: 'POST',
        body: { statements }
      })
      // data is an array aligned with statements order
      for (let index = 0; index < safeNames.length; index++) {
        const name = safeNames[index]
        const res = data.data[index].results
        const rows = res.rows || []
        const tableSchema = this.adapter?.adaptTableSchemaFromPragmaRows?.(rows) || []
        await this._setSchemaCache(databaseId, name, tableSchema)
      }
    } catch {
      console.error('Failed to refresh schema cache')
    }
  }
  getCachedTableSchema(databaseId, tableName) {
    return this._getSchemaCache(databaseId, tableName)
  }

  async _adaptTableInfoWithCache(databaseId, tableName, data) {
    const adapted = this.adapter?.adaptTableInfo?.(data)
    try {
      await this._setSchemaCache(databaseId, tableName, adapted?.tableSchema || [])
    } catch {
      console.error('Failed to set schema cache')
    }
    return adapted
  }

  _adaptTableInfoFromCache(schema, data) {
    return this.adapter?.adaptTableInfo?.(data, schema)
  }
}

export const edgeSQLService = new EdgeSQLService()
