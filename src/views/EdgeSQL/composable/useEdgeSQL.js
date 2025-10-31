import { ref, computed } from 'vue'
import { convertValueToDate } from '@/helpers/convert-date'
import { edgeSQLService } from '@/services/v2/edge-sql/edge-sql-service'
import { useRoute } from 'vue-router'
import { useToast } from 'primevue/usetoast'

// Global state to share between components
let globalState = null

const STORAGE_KEYS = {
  QUERY_HISTORY: 'edge_sql_query_history',
  CURRENT_DATABASE: 'edge_sql_current_database'
}

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

const detectQueryType = (query) => {
  if (!query || typeof query !== 'string') return 'execute'

  const normalizedQuery = Array.isArray(query)
    ? query[0].trim().toUpperCase()
    : query.trim().toUpperCase()

  if (normalizedQuery.startsWith('SELECT')) return 'query'
  if (normalizedQuery.startsWith('INSERT')) return 'insert'
  if (normalizedQuery.startsWith('UPDATE')) return 'update'
  if (normalizedQuery.startsWith('DELETE')) return 'delete'
  if (normalizedQuery.startsWith('CREATE')) return 'create'
  if (normalizedQuery.startsWith('ALTER')) return 'alter'
  if (normalizedQuery.startsWith('DROP')) return 'drop'
  if (normalizedQuery.startsWith('PRAGMA')) return 'pragma'
  return 'execute'
}

const handleType = (type) => {
  switch (type) {
    case 'query':
      return {
        content: 'SELECT',
        severity: 'info'
      }
    case 'insert':
      return {
        content: 'INSERT',
        severity: 'success'
      }
    case 'update':
      return {
        content: 'UPDATE',
        severity: 'warn'
      }
    case 'delete':
      return {
        content: 'DELETE',
        severity: 'danger'
      }
    case 'create':
      return {
        content: 'CREATE',
        severity: 'success'
      }
    case 'alter':
      return {
        content: 'ALTER',
        severity: 'warn'
      }
    case 'drop':
      return {
        content: 'DROP',
        severity: 'danger'
      }
    case 'pragma':
      return {
        content: 'PRAGMA',
        severity: 'info'
      }
    case 'execute':
      return {
        content: 'EXECUTE',
        severity: 'success'
      }
    default:
      return {
        content: 'UNKNOWN',
        severity: 'secondary'
      }
  }
}

const truncateQuery = (query, maxLength = 100) => {
  if (query.length <= maxLength) return query
  return query.substring(0, maxLength) + '...'
}

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
      timestamp: convertValueToDate(history.timestamp),
      type: handleType(history.type)
    }
  })
}

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

  // Function to detect non-editable queries (JOIN operations, PRAGMA, COUNT, etc.)
  const isNonEditableQuery = (query) => {
    if (!query || typeof query !== 'string') return false

    const joinKeywords = [
      'INNER JOIN',
      'LEFT JOIN',
      'RIGHT JOIN',
      'FULL JOIN',
      'FULL OUTER JOIN',
      'LEFT OUTER JOIN',
      'RIGHT OUTER JOIN',
      'CROSS JOIN',
      'NATURAL JOIN',
      'JOIN' // Generic JOIN
    ]

    const nonEditableKeywords = ['PRAGMA', 'COUNT(', 'ROUND(']

    const normalizedQuery = query.toUpperCase().replace(/\s+/g, ' ').trim()

    // Check for JOIN operations
    const hasJoin = joinKeywords.some((keyword) => normalizedQuery.includes(keyword))

    // Check for non-editable query types
    const hasNonEditableQuery = nonEditableKeywords.some((keyword) =>
      normalizedQuery.includes(keyword)
    )

    return hasJoin || hasNonEditableQuery
  }

  // Check if current query is non-editable
  const isNonEditableQueryResult = computed(() => {
    const result = isNonEditableQuery(currentQueryText.value)
    return result
  })

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
      originalQuery: result.query,
      type: detectQueryType(result.query)
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
    const splitIntoStatements = (query) =>
      String(query)
        .split(';')
        .map((part) => part.trim())
        .filter((part) => part.length > 0)

    const flatStatements = statements.flatMap((stmt) =>
      typeof stmt === 'string' ? splitIntoStatements(stmt) : []
    )

    const isSelectQuery = flatStatements.some((stmt) => stmt.toLowerCase().startsWith('select'))
    let queryResults = []
    let tableName = selectedTable.value?.name || null

    try {
      const startTime = Date.now()
      if (isSelectQuery) {
        if (!tableName) {
          const firstSelect = flatStatements.find((stmt) => stmt.toLowerCase().startsWith('select'))
          if (firstSelect) {
            const match = firstSelect.match(/from\s+["`]?([A-Za-z0-9_.-]+)["`]?/i)
            if (match && match[1]) tableName = match[1]
          }
        }

        if (tableName) {
          statements.push(`; PRAGMA table_info(${tableName});`)
        }

        const { results } = await edgeSQLService.queryDatabase(databaseId, {
          statements
        })
        // Centralize post-processing for SELECT queries
        if (Array.isArray(results) && results.length > 0) {
          const dataResult = results[0]
          const schemaResult = results[results.length - 1]
          const dataRows = Array.isArray(dataResult?.rows) ? dataResult.rows : []
          const schemaRows = Array.isArray(schemaResult?.rows) ? schemaResult.rows : []

          // Build a union of keys across all rows to detect actually returned columns
          const presentFields = new Set()
          for (const row of dataRows) {
            Object.keys(row || {}).forEach((keyName) => presentFields.add(keyName))
          }

          // If we have present fields, filter the schema accordingly
          const filteredSchemaRows = presentFields.size
            ? schemaRows.filter((col) => presentFields.has(col?.name))
            : schemaRows

          // Rebuild results array with filtered schema
          const nextResults = results.slice()
          nextResults[results.length - 1] = { ...schemaResult, rows: filteredSchemaRows }
          queryResults = nextResults
        } else {
          queryResults = results
        }
      } else {
        const { results } = await edgeSQLService.executeDatabase(databaseId, {
          statements
        })
        queryResults = results
      }

      if (addToHistory) {
        addQueryResult({
          query,
          results: queryResults,
          timestamp: new Date().toISOString(),
          executionTime: Date.now() - startTime
        })
      }

      if (!isSelectQuery) {
        toast.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Query executed successfully',
          life: 3000
        })
      }

      return {
        results: queryResults,
        tableNameExecuted: tableName
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
