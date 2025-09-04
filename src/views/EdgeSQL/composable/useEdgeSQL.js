import { ref, computed } from 'vue'
import { convertValueToDate } from '@/helpers/convert-date'
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

    const arrayResult = Array.isArray(result) ? result : []
    const resultParse = adaptHistory(arrayResult)
    return resultParse
  } catch (error) {
    return Array.isArray(defaultValue) ? defaultValue : []
  }
}

const handleType = (type) => {
  switch (type) {
    case 'query':
      return {
        content: 'SELECT',
        severity: 'info'
      }
    case 'execute':
      return {
        content: 'EXECUTE',
        severity: 'success'
      }
    case 'delete':
      return {
        content: 'DELETE',
        severity: 'danger'
      }
    default:
      return {
        content: 'Unknown',
        severity: 'danger'
      }
  }
}

const truncateQuery = (query, maxLength = 100) => {
  if (query.length <= maxLength) return query
  return query.substring(0, maxLength) + '...'
}

const adaptHistory = (histories) => {
  if (!Array.isArray(histories)) return []

  return histories.map((history) => ({
    executionTime: `${history.executionTime} ms`,
    query: truncateQuery(history.query),
    results: history.results,
    timestamp: convertValueToDate(history.timestamp),
    type: handleType(history.type),
    id: history.id
  }))
}

export function useEdgeSQL() {
  const databases = ref([])
  const currentDatabase = ref(null)
  const currentTables = ref([])
  const queryResults = ref(loadFromStorage(STORAGE_KEYS.QUERY_HISTORY, []))
  const isLoading = ref(false)
  const error = ref(null)
  const selectedTable = ref(null)

  const databasesCount = computed(() => databases.value.length)
  const hasCurrentDatabase = computed(() => !!currentDatabase.value)
  const currentDatabaseName = computed(() => currentDatabase.value?.name || '')
  const tablesCount = computed(() => currentTables.value.length)

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

  const setQueryResults = (results) => {
    queryResults.value = results
  }

  const addQueryResult = (result) => {
    const enrichedResult = {
      ...result,
      id: Date.now() + Math.random(),
      databaseId: currentDatabase.value?.id,
      databaseName: currentDatabase.value?.name
    }
    queryResults.value.unshift(enrichedResult)
    if (queryResults.value.length > 100) {
      queryResults.value = queryResults.value.slice(0, 100)
    }

    saveToStorage(STORAGE_KEYS.QUERY_HISTORY, queryResults.value)
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
    queryResults.value = loadFromStorage(STORAGE_KEYS.QUERY_HISTORY, [])
  }

  const importHistory = (historyData) => {
    if (historyData?.queries && Array.isArray(historyData.queries)) {
      queryResults.value = historyData.queries
      saveToStorage(STORAGE_KEYS.QUERY_HISTORY, queryResults.value)
      return true
    }
    return false
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

    // Computed
    databasesCount,
    hasCurrentDatabase,
    currentDatabaseName,
    tablesCount,

    // Actions
    setDatabases,
    addDatabase,
    removeDatabase,
    setCurrentDatabase,
    setCurrentTables,
    setSelectedTable,
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
    reset
  }
}
