/**
 * Query Keys Factory Pattern for Edge Applications
 * 
 * Centralizes all query keys used in Edge Applications to ensure consistency
 * and enable easy prefetching of related data.
 * 
 * IMPORTANT: Do NOT include 'GLOBAL' or other cache types in these keys.
 * The createQueryKey() function will add the cache type automatically.
 */

const CACHE_KEYS = {
  EDGE_APP: 'edge-apps-list',
  ORIGINS: 'origins-list',
  DEVICE_GROUPS: 'device-groups-list',
  CACHE_SETTINGS: 'cache-settings-list',
  FUNCTIONS: 'edge-app-functions-list',
  RULES_ENGINE: 'rules-engine-list',
  ERROR_RESPONSES: 'error-responses-list'
}

/**
 * Creates a query key for edge application list
 * @param {Object} params - Query parameters
 * @returns {Array} Query key array
 */
export const edgeAppKeys = {
  /**
   * Base key for all edge application queries (without cache type - it will be added by createQueryKey)
   */
  all: [CACHE_KEYS.EDGE_APP],

  /**
   * List queries
   * Uses the same format as createReactiveQueryKey to ensure cache hits
   * Parameters are formatted as strings: 'param=value'
   */
  list: (params = {}) => {
    const key = [CACHE_KEYS.EDGE_APP]
    
    // Add parameters in the same order as listEdgeApplicationsService
    // to ensure cache key consistency
    const { page, pageSize, ordering, search } = params
    
    if (page !== undefined && page !== null) {
      key.push(`page=${page}`)
    }
    if (pageSize !== undefined && pageSize !== null) {
      key.push(`pageSize=${pageSize}`)
    }
    if (ordering !== undefined && ordering !== null && ordering !== '') {
      key.push(`ordering=${ordering}`)
    }
    if (search !== undefined && search !== null && search !== '') {
      key.push(`search=${search}`)
    }
    
    return key
  },

  /**
   * Load queries
   */
  loads: () => [...edgeAppKeys.all, 'load'],
  load: (id, params) => [...edgeAppKeys.loads(), `id=${id}`, params || {}],

  /**
   * Origins queries
   */
  origins: {
    all: (edgeApplicationId) => [CACHE_KEYS.ORIGINS, `edgeAppId=${edgeApplicationId}`],
    list: (edgeApplicationId, params = {}) => {
      const { orderBy = 'origin_id', sort = 'asc', page = 1, pageSize = 200 } = params
      return [
        CACHE_KEYS.ORIGINS,
        `edgeAppId=${edgeApplicationId}`,
        `orderBy=${orderBy}`,
        `sort=${sort}`,
        `page=${page}`,
        `pageSize=${pageSize}`
      ]
    }
  },

  /**
   * Device Groups queries
   * Note: These services use createQueryKey which adds cache type automatically
   */
  deviceGroups: {
    all: (edgeApplicationId) => [CACHE_KEYS.DEVICE_GROUPS, `edgeAppId=${edgeApplicationId}`],
    list: (edgeApplicationId, params = {}) => {
      const defaultParams = { pageSize: 10, page: 1, ...params }
      return [CACHE_KEYS.DEVICE_GROUPS, `edgeAppId=${edgeApplicationId}`, defaultParams]
    }
  },

  /**
   * Cache Settings queries
   */
  cacheSettings: {
    all: (edgeApplicationId) => [CACHE_KEYS.CACHE_SETTINGS, `edgeAppId=${edgeApplicationId}`],
    list: (edgeApplicationId, params = {}) => {
      const defaultParams = { pageSize: 100, ...params }
      return [CACHE_KEYS.CACHE_SETTINGS, `edgeAppId=${edgeApplicationId}`, defaultParams]
    }
  },

  /**
   * Functions queries
   */
  functions: {
    all: (edgeApplicationId) => [CACHE_KEYS.FUNCTIONS, `edgeAppId=${edgeApplicationId}`],
    list: (edgeApplicationId, params = {}) => {
      const defaultParams = { pageSize: 10, fields: ['id', 'name', 'last_editor', 'last_modified', 'function'], ...params }
      return [CACHE_KEYS.FUNCTIONS, `edgeAppId=${edgeApplicationId}`, defaultParams]
    }
  },

  /**
   * Rules Engine queries (if needed)
   */
  rulesEngine: {
    all: (edgeApplicationId) => [CACHE_KEYS.RULES_ENGINE, `edgeAppId=${edgeApplicationId}`],
    list: (edgeApplicationId, params = {}) => {
      return [CACHE_KEYS.RULES_ENGINE, `edgeAppId=${edgeApplicationId}`, params || {}]
    }
  }
}
