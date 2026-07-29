import { ref, computed, watch } from 'vue'
import { useKeepAliveResource } from '@/composables/useKeepAliveResource'
import { rowKey } from './utils/row-key'
import { highlightMatch } from './utils/highlight-match'

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
 * Debounced document search over an ID-KEYED, LAZY search index (task 9.1, req
 * 4.2 & 4.16, P9). Entries are `Map<row.id, string>` (survives eviction/reorder),
 * built only while a query is active and released on inactive/resetToken/teardown.
 * Filtered result matches the trimmed, lowercased query against each row's text.
 *
 * @param {Object} options
 * @param {import('vue').Ref<object[]>} options.rows dataset rows (source of truth)
 * @param {import('vue').Ref<number>} [options.resetToken] bump invalidates the index
 */
export function useDocumentSearch({ rows, resetToken } = {}) {
  const query = ref('')
  const debouncedQuery = ref('')
  let timer = null

  watch(query, (nextQueryValue) => {
    clearTimeout(timer)
    timer = setTimeout(() => {
      debouncedQuery.value = nextQueryValue
    }, DEBOUNCE_MS)
  })

  // Id-keyed search index, built lazily and released when search is inactive.
  const searchIndex = new Map()

  const releaseIndex = () => {
    searchIndex.clear()
  }

  /**
   * Rebuilds the index from the current rows, keyed by identity. Idempotent:
   * clears stale entries (evicted/reordered rows) and (re)builds for the live
   * set. Called only while a query is active (lazy).
   */
  const buildIndex = () => {
    searchIndex.clear()
    const current = rows.value
    if (!Array.isArray(current)) return
    for (const row of current) {
      if (row == null) continue
      searchIndex.set(rowKey(row), buildRowEntry(row))
    }
  }

  const normalizedQuery = computed(() => debouncedQuery.value?.trim()?.toLowerCase() || '')
  const isSearchActive = computed(() => normalizedQuery.value.length > 0)

  // Lazy build/release driven by search activity. When the query becomes active
  // the index is built once; when it clears the index is released to 0 entries.
  watch(
    isSearchActive,
    (active) => {
      if (active) buildIndex()
      else releaseIndex()
    },
    { immediate: true }
  )

  // While a search is active, keep the id-keyed index in lock-step with rows
  // (loadMore append, eviction, reorder). Incremental (fix C3): index only NEW
  // keys and prune evicted ones — rows are append-only + id-stable, so existing
  // entries never change. Replaces the clear()+rebuild-all on every rows mutation.
  const syncIndex = () => {
    const current = rows.value
    if (!Array.isArray(current)) {
      searchIndex.clear()
      return
    }
    const liveKeys = new Set()
    for (const row of current) {
      if (row == null) continue
      const key = rowKey(row)
      liveKeys.add(key)
      if (!searchIndex.has(key)) searchIndex.set(key, buildRowEntry(row))
    }
    for (const key of searchIndex.keys()) {
      if (!liveKeys.has(key)) searchIndex.delete(key)
    }
  }

  watch(rows, () => {
    if (isSearchActive.value) syncIndex()
  })

  // A resetToken bump means "new query/filter/dataset" — invalidate the index.
  // Rebuild if still searching, otherwise leave it released.
  if (resetToken) {
    watch(resetToken, () => {
      if (isSearchActive.value) buildIndex()
      else releaseIndex()
    })
  }

  // Release/rehydrate the search index through a SINGLE keep-alive owner (task
  // 9.9, req 4.6; no-leak invariant). Release (deactivate/unmount) clears the
  // debounce timer + the heavy index; rehydrate (activate/mount) rebuilds ONLY
  // when a search is still active, else the index stays released (0 entries).
  const releaseSearch = () => {
    clearTimeout(timer)
    releaseIndex()
  }
  const rehydrateSearch = () => {
    if (isSearchActive.value) buildIndex()
  }
  useKeepAliveResource(rehydrateSearch, releaseSearch)

  const filteredData = computed(() => {
    const term = normalizedQuery.value
    if (!term) return rows.value
    const current = rows.value
    if (!Array.isArray(current)) return current
    return current.filter((row) => {
      if (row == null) return false
      const entry = searchIndex.get(rowKey(row))
      return entry != null && entry.includes(term)
    })
  })

  // Wraps the first occurrence of the active (debounced) search term in a <mark>
  // tag via the shared util (escape-all; only fixed <mark> markup is literal).
  const highlight = (text) => highlightMatch(text, debouncedQuery.value)

  /**
   * Entry count of the id-keyed search index; zero when search is inactive/
   * released (P9, req 4.16). A read-only introspection seam so the lazy-build /
   * teardown invariant can be asserted by count rather than inferred.
   */
  const indexSize = () => searchIndex.size

  return { query, debouncedQuery, filteredData, highlight, indexSize }
}
