/**
 * Query Keys Factory Pattern for Edge Applications
 * 
 * Centralizes all query keys used in Edge Applications to ensure consistency
 * and enable easy prefetching of related data.
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
   * Base key for all edge application queries
   */
  all: ['GLOBAL', CACHE_KEYS.EDGE_APP],

  /**
   * List queries
   */
  lists: () => [...edgeAppKeys.all, 'list'],
  list: (params) => [...edgeAppKeys.lists(), params],

  /**
   * Load queries
   */
  loads: () => [...edgeAppKeys.all, 'load'],
  load: (id, params) => [...edgeAppKeys.loads(), `id=${id}`, params || {}],

  /**
   * Origins queries
   * Note: Origins service uses 'global' (lowercase) directly in the query key
   */
  origins: {
    all: (edgeApplicationId) => ['global', CACHE_KEYS.ORIGINS, `edgeAppId=${edgeApplicationId}`],
    list: (edgeApplicationId, params = {}) => {
      const { orderBy = 'origin_id', sort = 'asc', page = 1, pageSize = 200 } = params
      return [
        'global',
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
   * For prefetch, we need to include 'GLOBAL' explicitly
   */
  deviceGroups: {
    all: (edgeApplicationId) => ['GLOBAL', CACHE_KEYS.DEVICE_GROUPS, `edgeAppId=${edgeApplicationId}`],
    list: (edgeApplicationId, params = {}) => {
      const defaultParams = { pageSize: 10, page: 1, ...params }
      return ['GLOBAL', CACHE_KEYS.DEVICE_GROUPS, `edgeAppId=${edgeApplicationId}`, defaultParams]
    }
  },

  /**
   * Cache Settings queries
   */
  cacheSettings: {
    all: (edgeApplicationId) => ['GLOBAL', CACHE_KEYS.CACHE_SETTINGS, `edgeAppId=${edgeApplicationId}`],
    list: (edgeApplicationId, params = {}) => {
      const defaultParams = { pageSize: 100, ...params }
      return ['GLOBAL', CACHE_KEYS.CACHE_SETTINGS, `edgeAppId=${edgeApplicationId}`, defaultParams]
    }
  },

  /**
   * Functions queries
   */
  functions: {
    all: (edgeApplicationId) => ['GLOBAL', CACHE_KEYS.FUNCTIONS, `edgeAppId=${edgeApplicationId}`],
    list: (edgeApplicationId, params = {}) => {
      const defaultParams = { pageSize: 10, fields: ['id', 'name', 'last_editor', 'last_modified', 'function'], ...params }
      return ['GLOBAL', CACHE_KEYS.FUNCTIONS, `edgeAppId=${edgeApplicationId}`, defaultParams]
    }
  },

  /**
   * Rules Engine queries (if needed)
   */
  rulesEngine: {
    all: (edgeApplicationId) => ['GLOBAL', CACHE_KEYS.RULES_ENGINE, `edgeAppId=${edgeApplicationId}`],
    list: (edgeApplicationId, params = {}) => {
      return ['GLOBAL', CACHE_KEYS.RULES_ENGINE, `edgeAppId=${edgeApplicationId}`, params || {}]
    }
  }
}

