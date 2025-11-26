/* eslint-disable no-console */
import { setWithExpiration, getWithExpiration } from '@/helpers/local-storage-manager'

export const schemaCacheKey = (databaseId, tableName) => `edgeSql:schema:${databaseId}:${tableName}`

export const getSchemaCache = (databaseId, tableName) => {
  try {
    const key = schemaCacheKey(databaseId, tableName)
    const value = getWithExpiration(key, { encrypt: false })
    return Array.isArray(value) ? value : value || null
  } catch {
    return null
  }
}

export const setSchemaCache = (databaseId, tableName, schema, ttlMs) => {
  try {
    const key = schemaCacheKey(databaseId, tableName)
    const minutes = Math.max(1, Math.ceil((Number(ttlMs) || 0) / 60000))
    setWithExpiration({ key, value: schema, expirationMinutes: minutes, encrypt: false })
  } catch {
    console.error('Failed to set schema cache')
  }
}

export const invalidateSchemaCache = (databaseId, tableName) => {
  try {
    const key = schemaCacheKey(databaseId, tableName)
    localStorage.removeItem(key)
  } catch {
    console.error('Failed to invalidate schema cache')
  }
}

export const refreshAllSchemasCache = async (
  http,
  baseURL,
  databaseId,
  tableNames,
  adapter,
  ttlMs
) => {
  try {
    const safeNames = Array.isArray(tableNames) ? tableNames.filter(Boolean) : []
    if (!safeNames.length) return
    const statements = safeNames.map((name) => `PRAGMA table_info(${name});`)
    const { data } = await http.request({
      url: `${baseURL}/${databaseId}/query`,
      method: 'POST',
      body: { statements }
    })
    for (let index = 0; index < safeNames.length; index++) {
      const name = safeNames[index]
      const res = data.data[index].results
      const rows = res.rows || []
      const tableSchema = adapter?.adaptTableSchemaFromPragmaRows?.(rows) || []
      setSchemaCache(databaseId, name, tableSchema, ttlMs)
    }
  } catch {
    console.error('Failed to refresh schema cache')
  }
}

export const refreshSchemaCache = async (http, baseURL, databaseId, tableName, adapter, ttlMs) => {
  await refreshAllSchemasCache(http, baseURL, databaseId, [tableName], adapter, ttlMs)
  return getSchemaCache(databaseId, tableName) || []
}

export const adaptTableInfoWithCache = async (databaseId, tableName, data, adapter, ttlMs) => {
  const adapted = adapter?.adaptTableInfo?.(data)
  try {
    setSchemaCache(databaseId, tableName, adapted?.tableSchema || [], ttlMs)
  } catch {
    console.error('Failed to set schema cache')
  }
  return adapted
}

export const adaptTableInfoFromCache = (schema, data, adapter) => {
  return adapter?.adaptTableInfo?.(data, schema)
}
