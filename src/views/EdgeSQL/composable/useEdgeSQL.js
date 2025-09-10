import { ref, computed } from 'vue'
import { convertValueToDate } from '@/helpers/convert-date'
import { edgeSQLService } from '@/services/v2'
import { useRoute } from 'vue-router'
const STORAGE_KEYS = {
  QUERY_HISTORY: 'edge_sql_query_history',
  CURRENT_DATABASE: 'edge_sql_current_database'
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

const loadHistoryFromStorage = () => {
  const rawHistory = loadFromStorage(STORAGE_KEYS.QUERY_HISTORY, [])
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
  const route = useRoute()
  const databases = ref([])
  const currentDatabase = ref(null)
  const currentTables = ref([])
  const queryResults = ref(loadHistoryFromStorage())
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
    }
  }

  const setCurrentTables = (tables) => {
    currentTables.value = tables
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

    // Save raw data to localStorage
    const rawHistory = loadFromStorage(STORAGE_KEYS.QUERY_HISTORY, [])
    rawHistory.unshift(enrichedResult)

    if (rawHistory.length > 100) {
      rawHistory.splice(100)
    }

    saveToStorage(STORAGE_KEYS.QUERY_HISTORY, rawHistory)

    // Update reactive state with adapted data
    queryResults.value = adaptHistory(rawHistory)
  }

  const clearQueryResults = () => {
    queryResults.value = []
    saveToStorage(STORAGE_KEYS.QUERY_HISTORY, [])
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
    saveToStorage(STORAGE_KEYS.QUERY_HISTORY, queryResults.value)
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
    const loadedHistory = loadHistoryFromStorage()
    queryResults.value = loadedHistory
    return loadedHistory
  }

  const importHistory = (historyData) => {
    if (historyData?.queries && Array.isArray(historyData.queries)) {
      queryResults.value = historyData.queries
      saveToStorage(STORAGE_KEYS.QUERY_HISTORY, queryResults.value)
      return true
    }
    return false
  }

  const executeQuery = async (query) => {
    isLoading.value = true

    const databaseId = currentDatabase.value?.id || route.params.id
    const isSelectQuery = Array.isArray(query)
      ? query[0].trim().toLowerCase().startsWith('select')
      : query.trim().toLowerCase().startsWith('select')
    let queryResults = []

    try {
      const startTime = Date.now()
      if (isSelectQuery) {
        const { results } = await edgeSQLService.queryDatabase(databaseId, {
          statements: query
        })
        queryResults = results
      } else {
        const { results } = await edgeSQLService.executeDatabase(databaseId, {
          statements: query
        })
        queryResults = results
      }

      addQueryResult({
        query,
        results: queryResults,
        timestamp: new Date().toISOString(),
        executionTime: Date.now() - startTime
      })

      return queryResults
    } catch (error) {
      setError(error.message)
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

  return {
    // State
    databases,
    currentDatabase,
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
    isNonEditableQuery
  }
}
