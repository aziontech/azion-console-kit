import { ref, computed } from 'vue'
import { convertValueToDate } from '@/helpers/convert-date'
import { edgeSQLService } from '@/services/v2/edge-sql/edge-sql-service'
import { useRoute } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { getSchemaCache } from '@/services/v2/edge-sql/utils/schema-helpers'

// EdgeSQL composable: Single source of UI-facing state and actions for running queries
// and presenting results. Keeps responsibilities clear and small, delegates schema
// concerns to helpers and service.

// Global state to share between components
let globalState = null

// LocalStorage keys used by this feature
const STORAGE_KEYS = {
  QUERY_HISTORY: 'edge_sql_query_history',
  CURRENT_DATABASE: 'edge_sql_current_database'
}

// SQL parsing helpers and constants
const JOIN_KEYWORDS = [
  'INNER JOIN',
  'LEFT JOIN',
  'RIGHT JOIN',
  'FULL JOIN',
  'FULL OUTER JOIN',
  'LEFT OUTER JOIN',
  'RIGHT OUTER JOIN',
  'CROSS JOIN',
  'NATURAL JOIN',
  'JOIN'
]

const NON_EDITABLE_KEYWORDS = ['PRAGMA', 'COUNT(', 'ROUND(']

const normalizeSql = (query) =>
  String(query || '')
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .trim()

// Storage helpers
const getDatabaseSpecificKey = (baseKey, databaseName) => {
  return databaseName ? `${baseKey}_${databaseName}` : baseKey
}

const saveToStorage = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch (error) {
    // Silently handle localStorage save errors
  }
}

const loadFromStorage = (key, defaultValue = null) => {
  try {
    const item = localStorage.getItem(key)
    const result = item ? JSON.parse(item) : defaultValue
    return Array.isArray(result) ? result : []
  } catch (error) {
    return Array.isArray(defaultValue) ? defaultValue : []
  }
}

const loadHistoryFromStorage = (databaseName = null) => {
  const key = getDatabaseSpecificKey(STORAGE_KEYS.QUERY_HISTORY, databaseName)
  const rawHistory = loadFromStorage(key, [])
  return adaptHistory(rawHistory)
}

const truncateQuery = (query, maxLength = 100) => {
  if (query.length <= maxLength) return query
  return query.substring(0, maxLength) + '...'
}

// Normalizes history items for display
const adaptHistory = (histories) => {
  if (!Array.isArray(histories)) return []

  return histories.map((history) => {
    // Check if already adapted to avoid reprocessing
    const isAlreadyAdapted =
      typeof history.executionTime === 'string' && history.executionTime.includes('ms')

    if (isAlreadyAdapted) {
      return history
    }

    return {
      ...history,
      executionTime: `${history.executionTime} ms`,
      query: truncateQuery(history.originalQuery || history.query),
      originalQuery: history.originalQuery || history.query,
      timestamp: convertValueToDate(history.timestamp)
    }
  })
}

// Extracts table names referenced in SELECT statements
const detectSelectTableNames = (stmts) => {
  const tableNames = new Set()
  for (const stmtCandidate of stmts) {
    const lower = String(stmtCandidate).toLowerCase().trim()
    if (!lower.startsWith('select')) continue
    const regex = /(from|join)\s+[`"']?([A-Za-z0-9_.-]+)[`"']?/gi
    let matchResult
    while ((matchResult = regex.exec(stmtCandidate)) !== null) {
      const name = matchResult[2]
      if (name) tableNames.add(name)
    }
  }
  if (tableNames.size === 0) {
    const firstSelect = stmts.find((stmtCandidate) =>
      String(stmtCandidate).toLowerCase().startsWith('select')
    )
    if (firstSelect) {
      const match = String(firstSelect).match(/from\s+["`]?([A-Za-z0-9_.-]+)["`]?/i)
      if (match && match[1]) tableNames.add(match[1])
    }
  }
  return tableNames
}

// Appends a schema item to results. Uses API columns for aliased/COUNT,
// otherwise merges cached schema filtered by present fields.
const postprocessSelectResults = (
  results,
  tableNames,
  { databaseId, queryHasAlias, isCountSelect }
) => {
  if (!Array.isArray(results) || results.length === 0) return results

  const dataResult = results[0]
  const dataRows = Array.isArray(dataResult?.rows) ? dataResult.rows : []

  // Build a union of keys across all rows to detect actually returned columns
  const presentFields = new Set()
  for (const row of dataRows) {
    Object.keys(row || {}).forEach((keyName) => presentFields.add(keyName))
  }

  // If aliased or count-only, generate schema from API-returned columns
  if (queryHasAlias || isCountSelect) {
    return buildSchemaFromApiColumns(results)
  }

  // Merge cached schema for detected tables
  let mergedSchemaRows = []
  if (tableNames && tableNames.size > 0 && databaseId) {
    for (const name of tableNames) {
      const cached = getSchemaCache(databaseId, name) || []
      mergedSchemaRows = mergedSchemaRows.concat(cached)
    }
  }

  const apiColumns = Array.isArray(dataResult?.columns) ? dataResult.columns : null
  const filteredMerged = presentFields.size
    ? mergedSchemaRows.filter((col) => presentFields.has(col?.name))
    : mergedSchemaRows

  // If API provided columns, use them as source of truth for multiplicity and order
  let finalSchemaRows
  if (apiColumns && apiColumns.length) {
    // Fast index by name for cache lookups (first match wins)
    const byName = new Map()
    for (const col of filteredMerged) {
      if (!col?.name || byName.has(col.name)) continue
      byName.set(col.name, col)
    }
    finalSchemaRows = apiColumns.map(
      (colName) => byName.get(colName) || { name: colName, type: null }
    )
  } else {
    // Fallback: no columns array; keep filtered cache result
    finalSchemaRows = filteredMerged
  }

  const schemaResult = {
    columns: ['name', 'type'],
    rows: finalSchemaRows,
    statement: '-- cached: table schema',
    queryDurationMs: 0,
    rowsRead: 0,
    rowsWritten: 0
  }

  return [...results, schemaResult]
}

// Derive column names from object-shaped rows
const deriveNamesFromRows = (rows) => {
  const present = new Set()
  for (const row of rows) Object.keys(row || {}).forEach((keyName) => present.add(keyName))
  return Array.from(present)
}

// Build a standardized schema result item from a list of names
const buildSchemaItem = (names) => ({
  columns: ['name', 'type'],
  rows: names.map((colName) => ({ name: colName, type: null })),
  statement: '-- generated: api columns',
  queryDurationMs: 0,
  rowsRead: 0,
  rowsWritten: 0
})

// Convert array-of-values rows into object rows using provided column names
const zipRowsWithColumns = (columns, rows) =>
  rows.map((rowArray) => {
    const obj = {}
    for (let columnIndex = 0; columnIndex < columns.length; columnIndex++) {
      obj[columns[columnIndex]] = rowArray[columnIndex]
    }
    return obj
  })

// From API result, return normalized data + a schema item.
// If rows are arrays, zip with columns; else infer names and append schema.
const buildSchemaFromApiColumns = (results) => {
  if (!Array.isArray(results) || results.length === 0) return results
  const dataResult = results[0]
  const columns = Array.isArray(dataResult?.columns) ? dataResult.columns : null
  const rows = Array.isArray(dataResult?.rows) ? dataResult.rows : []

  if (columns && columns.length && Array.isArray(rows[0])) {
    const normalizedRows = zipRowsWithColumns(columns, rows)
    const dataFixed = { ...dataResult, columns, rows: normalizedRows }
    const schemaItem = buildSchemaItem(columns)
    return [dataFixed, schemaItem]
  }

  const names = columns && columns.length ? columns : deriveNamesFromRows(rows)
  const schemaItem = buildSchemaItem(names)
  return [...results, schemaItem]
}

// Split raw SQL text into executable statements
const splitIntoStatements = (query) =>
  String(query)
    .split(';')
    .map((part) => part.trim())
    .filter((part) => part.length > 0)

export function useEdgeSQL() {
  // Return existing global state if it exists
  if (globalState) {
    return globalState
  }

  const route = useRoute()
  const toast = useToast()
  const databases = ref([])
  const currentDatabase = ref(null)
  const databaseCreated = ref(null)
  const currentTables = ref([])
  const queryResults = ref([])
  const isLoading = ref(false)
  const error = ref(null)
  const selectedTable = ref(null)
  const currentQueryText = ref('')

  const databasesCount = computed(() => databases.value.length)
  const hasCurrentDatabase = computed(() => !!currentDatabase.value)
  const currentDatabaseName = computed(() => currentDatabase.value?.name || '')
  const tablesCount = computed(() => currentTables.value.length)

  // Detects non-editable queries (JOIN operations, PRAGMA, COUNT, etc.)
  const isNonEditableQuery = (query) => {
    if (!query || typeof query !== 'string') return false

    const normalizedQuery = normalizeSql(query)
    const hasJoin = JOIN_KEYWORDS.some((keyword) => normalizedQuery.includes(keyword))
    const hasNonEditableQuery = NON_EDITABLE_KEYWORDS.some((keyword) =>
      normalizedQuery.includes(keyword)
    )
    return hasJoin || hasNonEditableQuery
  }

  // Check if current query is non-editable
  const isNonEditableQueryResult = computed(() => isNonEditableQuery(currentQueryText.value))

  const setDatabases = (newDatabases) => {
    databases.value = newDatabases
  }

  const addDatabase = (database) => {
    databases.value.push(database)
  }

  const removeDatabase = (databaseId) => {
    databases.value = databases.value.filter((db) => db.id !== databaseId)
    if (currentDatabase.value?.id === databaseId) {
      currentDatabase.value = null
      currentTables.value = []
      selectedTable.value = null
    }
  }

  const setCurrentDatabase = (database) => {
    currentDatabase.value = database
    currentTables.value = []
    selectedTable.value = null

    if (database) {
      saveToStorage(STORAGE_KEYS.CURRENT_DATABASE, database)
      // Load history specific to this database
      queryResults.value = loadHistoryFromStorage(database.name)
    }
  }

  const setCurrentTables = (tables) => {
    currentTables.value = tables
  }

  const setDatabaseCreated = (database) => {
    databaseCreated.value = database
  }

  const setSelectedTable = (table) => {
    selectedTable.value = table
  }

  const setCurrentQueryText = (query) => {
    currentQueryText.value = query
  }

  const setQueryResults = (results) => {
    queryResults.value = results
  }

  const addQueryResult = (result) => {
    const enrichedResult = {
      ...result,
      id: Date.now() + Math.random(),
      databaseId: currentDatabase.value?.id,
      databaseName: currentDatabase.value?.name,
      originalQuery: result.query
    }

    // Save raw data to localStorage with database-specific key
    const databaseName = currentDatabase.value?.name
    const key = getDatabaseSpecificKey(STORAGE_KEYS.QUERY_HISTORY, databaseName)
    const rawHistory = loadFromStorage(key, [])
    rawHistory.unshift(enrichedResult)

    if (rawHistory.length > 100) {
      rawHistory.splice(100)
    }

    saveToStorage(key, rawHistory)

    // Update reactive state with adapted data
    queryResults.value = adaptHistory(rawHistory)
  }

  const clearQueryResults = () => {
    queryResults.value = []
    const databaseName = currentDatabase.value?.name
    const key = getDatabaseSpecificKey(STORAGE_KEYS.QUERY_HISTORY, databaseName)
    saveToStorage(key, [])
  }

  const setLoading = (loading) => {
    isLoading.value = loading
  }

  const setError = (errorMessage) => {
    error.value = errorMessage
  }

  const clearError = () => {
    error.value = null
  }

  const removeQueryFromHistory = (queryId) => {
    queryResults.value = queryResults.value.filter((query) => query.id !== queryId)
    const databaseName = currentDatabase.value?.name
    const key = getDatabaseSpecificKey(STORAGE_KEYS.QUERY_HISTORY, databaseName)
    saveToStorage(key, queryResults.value)
  }

  const getQueryHistoryForDatabase = (databaseId) => {
    return queryResults.value.filter((query) => query.databaseId === databaseId)
  }

  const exportHistory = () => {
    return {
      queries: queryResults.value,
      exportedAt: new Date().toISOString(),
      version: '1.0'
    }
  }

  const updateListHistory = () => {
    const databaseName = currentDatabase.value?.name
    const loadedHistory = loadHistoryFromStorage(databaseName)
    queryResults.value = loadedHistory
    return loadedHistory
  }

  const importHistory = (historyData) => {
    if (historyData?.queries && Array.isArray(historyData.queries)) {
      queryResults.value = historyData.queries
      const databaseName = currentDatabase.value?.name
      const key = getDatabaseSpecificKey(STORAGE_KEYS.QUERY_HISTORY, databaseName)
      saveToStorage(key, queryResults.value)
      return true
    }
    return false
  }

  const executeQuery = async (query, { addToHistory = true } = {}) => {
    isLoading.value = true

    const databaseId = currentDatabase.value?.id || route.params.id
    const statements = Array.isArray(query) ? [...query] : [query]
    const flatStatements = statements.flatMap((stmt) =>
      typeof stmt === 'string' ? splitIntoStatements(stmt) : []
    )

    // Determine whether we should fetch metadata for SELECT queries
    // Rule: If ALL SELECT statements are COUNT-only (e.g., SELECT COUNT(*) FROM ...), skip metadata.
    const selectStatements = flatStatements.filter((stmt) =>
      String(stmt).trim().toLowerCase().startsWith('select')
    )
    const hasAnySelect = selectStatements.length > 0
    let queryResults = []
    let tableNameExecuted

    try {
      const startTime = Date.now()
      if (hasAnySelect) {
        const tableNames = detectSelectTableNames(flatStatements)
        tableNameExecuted = Array.from(tableNames)[0]
        const { results } = await edgeSQLService.queryDatabase(databaseId, { statements })
        const countOnlyRegex = /^\s*select\s+count\s*\(\s*\*\s*\)(\s+as\s+\w+)?\s+from\b/i
        const isCountSelect =
          selectStatements.length > 0 && selectStatements.every((stmt) => countOnlyRegex.test(stmt))
        const queryHasAlias = flatStatements.some((stmt) => /\bas\s+\w+/i.test(String(stmt)))
        queryResults = postprocessSelectResults(results, tableNames, {
          databaseId,
          queryHasAlias,
          isCountSelect
        })
      } else {
        const { results } = await edgeSQLService.executeDatabase(databaseId, { statements })
        queryResults = buildSchemaFromApiColumns(results)
      }

      if (addToHistory) {
        addQueryResult({
          query,
          results: queryResults,
          timestamp: new Date().toISOString(),
          executionTime: Date.now() - startTime
        })
      }

      if (!hasAnySelect) {
        toast.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Query executed successfully',
          life: 3000
        })
      }

      return {
        results: queryResults,
        tableNameExecuted
      }
    } catch (error) {
      if (error && typeof error.showErrors === 'function') {
        error.showErrors(toast)
      }
      setError(error.message)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const reset = () => {
    databases.value = []
    currentDatabase.value = null
    currentTables.value = []
    queryResults.value = []
    selectedTable.value = null
    isLoading.value = false
    error.value = null

    localStorage.removeItem(STORAGE_KEYS.QUERY_HISTORY)
    localStorage.removeItem(STORAGE_KEYS.CURRENT_DATABASE)
  }

  // Create the composable object
  const composable = {
    // State
    databases,
    currentDatabase,
    databaseCreated,
    currentTables,
    queryResults,
    isLoading,
    error,
    selectedTable,
    currentQueryText,

    // Computed
    databasesCount,
    hasCurrentDatabase,
    currentDatabaseName,
    tablesCount,
    isNonEditableQueryResult,

    // Actions
    setDatabases,
    addDatabase,
    removeDatabase,
    setCurrentDatabase,
    setCurrentTables,
    setSelectedTable,
    setCurrentQueryText,
    setQueryResults,
    addQueryResult,
    clearQueryResults,
    removeQueryFromHistory,
    getQueryHistoryForDatabase,
    exportHistory,
    importHistory,
    updateListHistory,
    setLoading,
    setError,
    clearError,
    reset,
    executeQuery,
    isNonEditableQuery,
    setDatabaseCreated
  }

  // Store as global state
  globalState = composable

  return composable
}
