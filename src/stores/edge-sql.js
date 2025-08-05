import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const STORAGE_KEYS = {
  QUERY_HISTORY: 'edge_sql_query_history',
  CURRENT_DATABASE: 'edge_sql_current_database'
}

// Funções utilitárias para localStorage
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
    return item ? JSON.parse(item) : defaultValue
  } catch (error) {
    // Silently handle localStorage load errors
    return defaultValue
  }
}

export const useEdgeSQLStore = defineStore('edgeSQL', () => {
  // State
  const databases = ref([])
  const currentDatabase = ref(null)
  const currentTables = ref([])
  const queryResults = ref(loadFromStorage(STORAGE_KEYS.QUERY_HISTORY, []))
  const isLoading = ref(false)
  const error = ref(null)
  const selectedTable = ref(null)

  // Getters
  const databasesCount = computed(() => databases.value.length)
  const hasCurrentDatabase = computed(() => !!currentDatabase.value)
  const currentDatabaseName = computed(() => currentDatabase.value?.name || '')
  const tablesCount = computed(() => currentTables.value.length)

  // Actions
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

    // Salvar database atual no localStorage
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
    // Adicionar timestamp único e database info
    const enrichedResult = {
      ...result,
      id: Date.now() + Math.random(), // ID único
      databaseId: currentDatabase.value?.id,
      databaseName: currentDatabase.value?.name
    }

    queryResults.value.unshift(enrichedResult)

    // Limitar histórico a 100 queries para não sobrecarregar localStorage
    if (queryResults.value.length > 100) {
      queryResults.value = queryResults.value.slice(0, 100)
    }

    // Salvar no localStorage
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

    // Limpar localStorage
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

    // Getters
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
    setLoading,
    setError,
    clearError,
    reset
  }
})
