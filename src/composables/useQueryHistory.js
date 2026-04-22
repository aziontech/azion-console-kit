import { ref } from 'vue'

const STORAGE_KEY = 'rte-query-history'
const MAX_HISTORY = 20

/**
 * Shared composable for managing AQL query history in localStorage.
 * Used by both Real-Time Events and Real-Time Metrics via the unified
 * `AdvancedFilterSystem` component.
 *
 * Provides add, remove, clear and a reactive list of recent queries.
 * The `dataset` attached to each entry is rendered as a badge in the
 * AQL dropdown's "Recent Queries" panel.
 */
export function useQueryHistory() {
  const history = ref(loadHistory())

  function loadHistory() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return []
      const parsed = JSON.parse(raw)
      // Clean up entries with "undefined" from a previous bug
      return parsed.filter((entry) => entry.query && !entry.query.includes('undefined'))
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
   * @param {string} [dataset] - Optional dataset name for context (shown as badge)
   * @param {Array} [filterFields] - Raw filter fields array for rehydrating on reload
   */
  function addQuery(queryText, dataset = '', filterFields = null) {
    if (!queryText || !queryText.trim()) return

    const trimmed = queryText.trim()

    // Remove duplicate if exists (same query + same dataset)
    history.value = history.value.filter(
      (entry) => !(entry.query === trimmed && entry.dataset === dataset)
    )

    history.value.unshift({
      query: trimmed,
      dataset,
      filterFields: filterFields ? JSON.parse(JSON.stringify(filterFields)) : null,
      timestamp: Date.now()
    })

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
