import { ref } from 'vue'

const STORAGE_KEY = 'rte-query-history'
const MAX_HISTORY = 20

/**
 * Composable for managing AQL query history in localStorage.
 * Provides add, remove, clear and a reactive list of recent queries.
 */
export function useQueryHistory() {
  const history = ref(loadHistory())

  function loadHistory() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  }

  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history.value))
    } catch {
      // ignore quota errors
    }
  }

  /**
   * Add a query to history. Deduplicates and keeps most recent first.
   * @param {string} queryText - The AQL query string
   * @param {string} [dataset] - Optional dataset name for context
   * @param {Array} [filterFields] - The raw filter fields array for reloading
   */
  function addQuery(queryText, dataset = '', filterFields = null) {
    if (!queryText || !queryText.trim()) return

    const trimmed = queryText.trim()

    // Remove duplicate if exists
    history.value = history.value.filter((entry) => entry.query !== trimmed)

    // Add to front
    history.value.unshift({
      query: trimmed,
      dataset,
      filterFields: filterFields ? JSON.parse(JSON.stringify(filterFields)) : null,
      timestamp: Date.now()
    })

    // Cap size
    if (history.value.length > MAX_HISTORY) {
      history.value = history.value.slice(0, MAX_HISTORY)
    }

    persist()
  }

  function removeQuery(index) {
    history.value.splice(index, 1)
    persist()
  }

  function clearHistory() {
    history.value = []
    persist()
  }

  return {
    history,
    addQuery,
    removeQuery,
    clearHistory
  }
}
