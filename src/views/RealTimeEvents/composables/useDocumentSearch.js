import { ref, computed, watch, onBeforeUnmount } from 'vue'

const DEBOUNCE_MS = 400

/**
 * Composable for debounced document search with pre-built index.
 * Filters table rows and provides text highlighting without regex.
 */
export function useDocumentSearch(tableData) {
  const query = ref('')
  const debouncedQuery = ref('')
  let timer = null

  watch(query, (nextQueryValue) => {
    clearTimeout(timer)
    timer = setTimeout(() => {
      debouncedQuery.value = nextQueryValue
    }, DEBOUNCE_MS)
  })

  onBeforeUnmount(() => clearTimeout(timer))

  // Pre-build a flat lowercase string per row for fast indexOf matching
  const searchIndex = computed(() => {
    return tableData.value.map((row) => {
      const parts = []
      for (const val of Object.values(row)) {
        if (val == null) continue
        if (Array.isArray(val)) {
          for (const item of val) {
            if (item && typeof item === 'object') parts.push(Object.values(item).join(' '))
            else if (item != null) parts.push(String(item))
          }
        } else if (typeof val !== 'object') {
          parts.push(String(val))
        }
      }
      return parts.join(' ').toLowerCase()
    })
  })

  const filteredData = computed(() => {
    const normalizedQuery = debouncedQuery.value?.trim()?.toLowerCase()
    if (!normalizedQuery) return tableData.value
    const indexedRows = searchIndex.value
    return tableData.value.filter((row, index) => {
      const hasRow = row != null
      return hasRow && indexedRows[index].includes(normalizedQuery)
    })
  })

  /**
   * Wraps the first occurrence of the search term in a <mark> tag.
   * Uses indexOf instead of regex to avoid escaping issues.
   */
  const highlight = (text) => {
    const normalizedQuery = debouncedQuery.value
    if (!normalizedQuery || !normalizedQuery.trim() || !text) return String(text)
    const str = String(text)
    const trimmedQuery = normalizedQuery.trim()
    const pos = str.toLowerCase().indexOf(trimmedQuery.toLowerCase())
    if (pos === -1) return str
    const len = trimmedQuery.length
    return (
      str.slice(0, pos) +
      '<mark class="search-highlight">' +
      str.slice(pos, pos + len) +
      '</mark>' +
      str.slice(pos + len)
    )
  }

  return { query, debouncedQuery, filteredData, highlight }
}
