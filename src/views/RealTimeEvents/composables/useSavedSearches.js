import { ref } from 'vue'
import safeStructuredClone from '@/helpers/structured-clone'

const STORAGE_KEY = 'rte-saved-searches'
const MAX_SAVED = 50

/**
 * Composable for managing saved searches in localStorage.
 * Each saved search stores: name, filters (fields), selectedColumns, dataset, tsRange.
 */
export function useSavedSearches() {
  const savedSearches = ref(load())

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  }

  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedSearches.value))
    } catch {
      // ignore quota errors
    }
  }

  /**
   * Save a new search.
   * @param {object} params
   * @param {string} params.name - User-chosen name
   * @param {object} params.filterData - The full filterData object (fields, tsRange, etc.)
   * @param {string[]} params.selectedColumns - Currently selected column field names
   * @param {string} params.dataset - Current dataset identifier
   */
  function saveSearch({ name, filterData, selectedColumns, dataset }) {
    if (!name || !name.trim()) return

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
