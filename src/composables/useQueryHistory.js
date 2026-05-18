import { ref, computed, watch } from 'vue'
import { useAccountStore } from '@/stores/account'

const LEGACY_KEY = 'rte-query-history'
const KEY_PREFIX = 'rte-query-history'
const MAX_HISTORY = 20

/**
 * Shared composable for managing AQL query history in localStorage.
 * Used by both Real-Time Events and Real-Time Metrics via the unified
 * `AdvancedFilterSystem` component.
 *
 * History is scoped per `client_id:user_id` so filters from one tenant /
 * user never appear in another's dropdown. The legacy unscoped key
 * (`rte-query-history`) is dropped on first load because its contents are
 * contaminated by definition — they may contain queries from any past
 * user/tenant on the same browser.
 */
export function useQueryHistory() {
  const accountStore = useAccountStore()

  const storageKey = computed(() => {
    const clientId = accountStore.account?.client_id
    const userId = accountStore.account?.user_id
    if (!clientId || !userId) return null
    return `${KEY_PREFIX}:${clientId}:${userId}`
  })

  const history = ref([])

  function load() {
    if (!storageKey.value) return []
    try {
      const raw = localStorage.getItem(storageKey.value)
      if (!raw) return []
      const parsed = JSON.parse(raw)
      // Clean up entries with "undefined" from a previous bug
      return parsed.filter((entry) => entry.query && !entry.query.includes('undefined'))
    } catch {
      return []
    }
  }

  function persist() {
    if (!storageKey.value) return
    try {
      localStorage.setItem(storageKey.value, JSON.stringify(history.value))
    } catch {
      // ignore quota errors
    }
  }

  // Drop the legacy unscoped key — contents are unsafe to attribute to any
  // current user/tenant. Done once per composable instantiation; the call is
  // idempotent if the key is already gone.
  try {
    localStorage.removeItem(LEGACY_KEY)
  } catch {
    // ignore
  }

  // Rehydrate history whenever the scoped key changes (account switch,
  // logout, or initial account load).
  watch(
    storageKey,
    (key) => {
      history.value = key ? load() : []
    },
    { immediate: true }
  )

  /**
   * Add a query to history. Deduplicates and keeps most recent first.
   * No-op if account context is missing (clientId/userId).
   * @param {string} queryText - The AQL query string
   * @param {string} [dataset] - Optional dataset name for context (shown as badge)
   * @param {Array} [filterFields] - Raw filter fields array for rehydrating on reload
   */
  function addQuery(queryText, dataset = '', filterFields = null) {
    if (!queryText || !queryText.trim()) return
    if (!storageKey.value) return

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
