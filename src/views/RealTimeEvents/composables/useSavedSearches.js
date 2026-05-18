import { ref, computed, watch } from 'vue'
import safeStructuredClone from '@/helpers/structured-clone'
import { useAccountStore } from '@/stores/account'

const LEGACY_KEY = 'rte-saved-searches'
const KEY_PREFIX = 'rte-saved-searches'
const MAX_SAVED = 50

/**
 * Composable for managing saved searches in localStorage.
 * Each saved search stores: name, filters (fields), selectedColumns, dataset, tsRange.
 *
 * Storage is scoped per `client_id:user_id` so saved searches from one
 * tenant / user never appear in another's overlay. The legacy unscoped key
 * (`rte-saved-searches`) is dropped on first load because its contents are
 * contaminated by definition — they may contain searches from any past
 * user/tenant on the same browser.
 */
export function useSavedSearches() {
  const accountStore = useAccountStore()

  const storageKey = computed(() => {
    const clientId = accountStore.account?.client_id
    const userId = accountStore.account?.user_id
    if (!clientId || !userId) return null
    return `${KEY_PREFIX}:${clientId}:${userId}`
  })

  const savedSearches = ref([])

  function load() {
    if (!storageKey.value) return []
    try {
      const raw = localStorage.getItem(storageKey.value)
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  }

  function persist() {
    if (!storageKey.value) return
    try {
      localStorage.setItem(storageKey.value, JSON.stringify(savedSearches.value))
    } catch {
      // ignore quota errors
    }
  }

  // Drop the legacy unscoped key — see useQueryHistory for rationale.
  try {
    localStorage.removeItem(LEGACY_KEY)
  } catch {
    // ignore
  }

  watch(
    storageKey,
    (key) => {
      savedSearches.value = key ? load() : []
    },
    { immediate: true }
  )

  /**
   * Save a new search. No-op if account context is missing.
   * @param {object} params
   * @param {string} params.name - User-chosen name
   * @param {object} params.filterData - The full filterData object (fields, tsRange, etc.)
   * @param {string[]} params.selectedColumns - Currently selected column field names
   * @param {string} params.dataset - Current dataset identifier
   */
  function saveSearch({ name, filterData, selectedColumns, dataset }) {
    if (!name || !name.trim()) return
    if (!storageKey.value) return

    const entry = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      name: name.trim(),
      filterData: filterData ? safeStructuredClone(filterData) : null,
      selectedColumns: selectedColumns || [],
      dataset: dataset || '',
      createdAt: Date.now()
    }

    savedSearches.value.unshift(entry)

    if (savedSearches.value.length > MAX_SAVED) {
      savedSearches.value = savedSearches.value.slice(0, MAX_SAVED)
    }

    persist()
    return entry
  }

  function deleteSearch(id) {
    savedSearches.value = savedSearches.value.filter((search) => search.id !== id)
    persist()
  }

  return {
    savedSearches,
    saveSearch,
    deleteSearch
  }
}
