/* eslint-disable no-console */

export const schemaCacheKey = (databaseId, tableName) => `edgeSql:schema:${databaseId}:${tableName}`

export const getSchemaCache = (databaseId, tableName) => {
  try {
    const key = schemaCacheKey(databaseId, tableName)
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

export const setSchemaCache = (databaseId, tableName, schema, ttlMs) => {
  try {
    const key = schemaCacheKey(databaseId, tableName)
    const payload = {
      schema,
      expiresAt: Date.now() + (Number(ttlMs) || 0)
    }
    localStorage.setItem(key, JSON.stringify(payload))
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
