// composables/useTableQueryParams.js
import { computed, watch } from 'vue'
import { useQueryParams } from './useQueryParamsAdvanced'

/**
 * Composable for managing table state (pagination, sorting, search) in URL query parameters
 *
 * @param {Object} config
 * @param {number} config.defaultPageSize - Default number of items per page
 * @param {string} config.defaultOrdering - Default ordering field
 * @param {Function} config.onStateChange - Callback when state changes (receives { page, pageSize, ordering, search })
 * @returns {Object} Table query state management API
 */
export function useTableQueryParams({
  defaultPageSize = 10,
  defaultOrdering = 'id',
  onStateChange = null
} = {}) {
  const queryParams = useQueryParams({
    defaults: {
      page: 1,
      pageSize: defaultPageSize,
      ordering: defaultOrdering,
      search: ''
    },
    decode: (key, value) => {
      switch (key) {
        case 'page':
        case 'pageSize':
          return value ? parseInt(value, 10) : null
        case 'ordering':
        case 'search':
          return value || ''
        default:
          return value
      }
    },
    encode: (key, value) => {
      if (value == null || value === '') return ''
      return String(value)
    },
    mode: 'replace',
    autoApplyDelay: 0,
    autoApplyKeys: []
  })

  // Computed properties for easy access
  const page = computed({
    get: () => queryParams.state.value.page,
    set: (value) => queryParams.setParam('page', value)
  })

  const pageSize = computed({
    get: () => queryParams.state.value.pageSize,
    set: (value) => queryParams.setParam('pageSize', value)
  })

  const ordering = computed({
    get: () => queryParams.state.value.ordering,
    set: (value) => queryParams.setParam('ordering', value)
  })

  const search = computed({
    get: () => queryParams.state.value.search,
    set: (value) => queryParams.setParam('search', value)
  })

  // Computed: first item index for DataTable
  const firstItemIndex = computed(() => {
    return (page.value - 1) * pageSize.value
  })

  // Helper to parse ordering into field and order
  const sortInfo = computed(() => {
    const ord = ordering.value || defaultOrdering
    const isDescending = ord.startsWith('-')
    const field = isDescending ? ord.substring(1) : ord
    return {
      field,
      order: isDescending ? -1 : 1
    }
  })

  /**
   * Update page number and apply to URL
   */
  const setPage = (newPage) => {
    page.value = newPage
    queryParams.applyParams()
  }

  /**
   * Update page size and reset to first page
   */
  const setPageSize = (newPageSize) => {
    pageSize.value = newPageSize
    page.value = 1 // Reset to first page when changing page size
    queryParams.applyParams()
  }

  /**
   * Update ordering and reset to first page
   */
  const setOrdering = (field, order = 1) => {
    const orderingValue = order === -1 ? `-${field}` : field
    ordering.value = orderingValue
    page.value = 1 // Reset to first page when sorting changes
    queryParams.applyParams()
  }

  /**
   * Update search and reset to first page
   */
  const setSearch = (searchValue) => {
    search.value = searchValue
    page.value = 1 // Reset to first page when searching
    queryParams.applyParams()
  }

  /**
   * Reset all parameters to defaults
   */
  const reset = () => {
    queryParams.resetParams()
  }

  /**
   * Sync state from URL (useful after navigation)
   */
  const syncFromUrl = () => {
    queryParams.syncFromUrl()
  }

  /**
   * Get current state as API parameters
   */
  const getApiParams = () => {
    return {
      page: page.value,
      pageSize: pageSize.value,
      ordering: ordering.value,
      search: search.value
    }
  }

  // Watch for state changes and trigger callback
  if (onStateChange) {
    watch(
      () => queryParams.state.value,
      (newState) => {
        onStateChange({
          page: newState.page,
          pageSize: newState.pageSize,
          ordering: newState.ordering,
          search: newState.search
        })
      },
      { deep: true }
    )
  }

  return {
    // Computed refs
    page,
    pageSize,
    ordering,
    search,
    firstItemIndex,
    sortInfo,

    // Methods
    setPage,
    setPageSize,
    setOrdering,
    setSearch,
    reset,
    syncFromUrl,
    getApiParams,

    // Raw state access
    state: queryParams.state,

    // Direct query params API (for advanced usage)
    applyParams: queryParams.applyParams
  }
}
