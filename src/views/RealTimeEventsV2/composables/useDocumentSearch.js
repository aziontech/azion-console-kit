import { ref, computed, watch, onBeforeUnmount, onDeactivated } from 'vue'

const DEBOUNCE_MS = 400

/**
 * Builds a flat lowercase string for a single row, used for fast indexOf matching.
 */
function buildRowEntry(row) {
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
}

/**
 * Composable for debounced document search with incrementally-built index.
 * Filters table rows and provides text highlighting without regex.
 *
 * The search index is maintained incrementally: on tableData growth (loadMore),
 * only newly appended rows are indexed. When tableData shrinks (new query),
 * the index is fully rebuilt.
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

  const clearTimer = () => clearTimeout(timer)

  onBeforeUnmount(clearTimer)
  onDeactivated(clearTimer)

  // Incremental search index: a flat lowercase string per row
  const searchIndex = ref([])
  let prevLength = 0

  watch(
    tableData,
    (rows) => {
      const currentLength = rows.length

      if (currentLength < prevLength) {
        // Data shrunk (new query) — full rebuild
        searchIndex.value = rows.map(buildRowEntry)
      } else if (currentLength > prevLength) {
        // Data grew (loadMore) — only index new rows
        for (let i = prevLength; i < currentLength; i++) {
          searchIndex.value.push(buildRowEntry(rows[i]))
        }
      }
      // If currentLength === prevLength, nothing changed

      prevLength = currentLength
    },
    { immediate: true }
  )

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
