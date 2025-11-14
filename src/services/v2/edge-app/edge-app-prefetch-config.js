/**
 * Edge Application Prefetch Configuration
 *
 * Defines which data should be prefetched and when for Edge Applications.
 * Integrated with base architecture.
 */

import { edgeAppKeys } from './edge-app-query-keys'
import { listOriginsService } from '@/services/edge-application-origins-services/list-origins-service'
import { deviceGroupService } from './edge-app-device-group-service'
import { cacheSettingsService } from './edge-app-cache-settings-service'
import { edgeApplicationFunctionService } from './edge-application-functions-service'
import { rulesEngineService } from './edge-app-rules-engine-service'
import { TABLE_FIRST_PAGE_OPTIONS } from '@/services/v2/base/query/config'
import { CACHE_TYPE } from '@/services/v2/base/query/config'
import { hasFlagBlockApiV4 } from '@/composables/user-flag'

/**
 * Gets the pageSize from localStorage tableDefinitions
 * Falls back to default value if not found
 *
 * @param {number} defaultValue - Default page size to use if localStorage value not found
 * @returns {number} The page size to use
 */
const getPageSizeFromTableDefinitions = (defaultValue = 10) => {
  try {
    const tableDefinitions = localStorage.getItem('tableDefinitions')
    if (tableDefinitions) {
      const parsed = JSON.parse(tableDefinitions)
      const numberOfLinesPerPage = parsed?.numberOfLinesPerPage
      if (numberOfLinesPerPage && typeof numberOfLinesPerPage === 'number') {
        return numberOfLinesPerPage
      }
    }
  } catch (error) {
    // Silently fallback to default if localStorage parse fails
  }
  return defaultValue
}

/**
 * Configuration constants
 *
 * Note: We use the user's pageSize preference from localStorage (tableDefinitions.numberOfLinesPerPage)
 * for all table listings to ensure consistency with what the user sees in the UI.
 */
const CONFIG = {
  ORIGINS: {
    ORDER_BY: 'origin_id',
    SORT: 'asc',
    // Use dynamic pageSize from user preferences
    get PAGE_SIZE() {
      return getPageSizeFromTableDefinitions(10)
    }
  },
  DEVICE_GROUPS: {
    get PAGE_SIZE() {
      return getPageSizeFromTableDefinitions(10)
    }
  },
  CACHE_SETTINGS: {
    get PAGE_SIZE() {
      return getPageSizeFromTableDefinitions(10)
    }
  },
  FUNCTIONS: {
    get PAGE_SIZE() {
      return getPageSizeFromTableDefinitions(10)
    },
    FIELDS: ['id', 'name', 'last_editor', 'last_modified', 'function']
  },
  RULES_ENGINE: {
    get PAGE_SIZE() {
      return getPageSizeFromTableDefinitions(10)
    }
  },
  LIST: {
    // Main Edge Applications list - use user's preference
    get PAGE_SIZE() {
      return getPageSizeFromTableDefinitions(10)
    },
    FIELDS: ['id', 'name', 'active', 'last_editor', 'last_modified', 'product_version']
  }
}

/**
 * Registers all prefetch configurations for Edge Applications
 * @param {Object} helpers - Helpers with registerPrefetch and PREFETCH_TRIGGERS
 */
export function registerEdgeAppPrefetchConfigs({ registerPrefetch, PREFETCH_TRIGGERS }) {
  // Origins prefetch
  registerPrefetch('edge-app:origins', {
    queryFn: (params) => {
      const { edgeApplicationId } = params
      const queryKey = edgeAppKeys.origins.list(edgeApplicationId, {
        page: 1,
        pageSize: CONFIG.ORIGINS.PAGE_SIZE,
        orderBy: CONFIG.ORIGINS.ORDER_BY,
        sort: CONFIG.ORIGINS.SORT
      })

      return {
        queryKey,
        queryFn: () =>
          listOriginsService({
            id: edgeApplicationId,
            orderBy: CONFIG.ORIGINS.ORDER_BY,
            sort: CONFIG.ORIGINS.SORT,
            page: 1,
            pageSize: CONFIG.ORIGINS.PAGE_SIZE
          })
      }
    },
    triggers: [PREFETCH_TRIGGERS.VIEW_EDGE_APP],
    cache: CACHE_TYPE.GLOBAL,
    options: {
      ...TABLE_FIRST_PAGE_OPTIONS,
      enabled: () => hasFlagBlockApiV4()
    }
  })

  // Device Groups prefetch
  registerPrefetch('edge-app:device-groups', {
    queryFn: (params) => {
      const { edgeApplicationId } = params
      const queryKey = edgeAppKeys.deviceGroups.list(edgeApplicationId, {
        page: 1,
        pageSize: CONFIG.DEVICE_GROUPS.PAGE_SIZE
      })

      return {
        queryKey,
        queryFn: () =>
          deviceGroupService.listDeviceGroupService(edgeApplicationId, {
            page: 1,
            pageSize: CONFIG.DEVICE_GROUPS.PAGE_SIZE
          })
      }
    },
    triggers: [PREFETCH_TRIGGERS.VIEW_EDGE_APP],
    cache: CACHE_TYPE.GLOBAL,
    options: TABLE_FIRST_PAGE_OPTIONS
  })

  // Cache Settings prefetch
  registerPrefetch('edge-app:cache-settings', {
    queryFn: (params) => {
      const { edgeApplicationId } = params
      const queryKey = edgeAppKeys.cacheSettings.list(edgeApplicationId, {
        pageSize: CONFIG.CACHE_SETTINGS.PAGE_SIZE
      })

      return {
        queryKey,
        queryFn: () =>
          cacheSettingsService.listCacheSettingsService(edgeApplicationId, {
            pageSize: CONFIG.CACHE_SETTINGS.PAGE_SIZE
          })
      }
    },
    triggers: [PREFETCH_TRIGGERS.VIEW_EDGE_APP],
    cache: CACHE_TYPE.GLOBAL,
    options: TABLE_FIRST_PAGE_OPTIONS
  })

  // Functions prefetch
  registerPrefetch('edge-app:functions', {
    queryFn: (params) => {
      const { edgeApplicationId } = params
      const queryKey = edgeAppKeys.functions.list(edgeApplicationId, {
        pageSize: CONFIG.FUNCTIONS.PAGE_SIZE,
        fields: CONFIG.FUNCTIONS.FIELDS
      })

      return {
        queryKey,
        queryFn: () =>
          edgeApplicationFunctionService.listEdgeApplicationFunctions(edgeApplicationId, {
            pageSize: CONFIG.FUNCTIONS.PAGE_SIZE,
            fields: CONFIG.FUNCTIONS.FIELDS
          })
      }
    },
    triggers: [PREFETCH_TRIGGERS.VIEW_EDGE_APP],
    cache: CACHE_TYPE.GLOBAL,
    options: {
      meta: { persist: false },
      enabled: (params) => {
        return params?.edgeFunctionsEnabled === true
      }
    }
  })

  // Rules Engine prefetch
  registerPrefetch('edge-app:rules-engine', {
    queryFn: (params) => {
      const { edgeApplicationId } = params
      const queryKey = edgeAppKeys.rulesEngine.list(edgeApplicationId, {
        pageSize: CONFIG.RULES_ENGINE.PAGE_SIZE
      })

      return {
        queryKey,
        queryFn: () =>
          rulesEngineService.listRulesEngineRequestAndResponsePhase({
            edgeApplicationId,
            params: { pageSize: CONFIG.RULES_ENGINE.PAGE_SIZE }
          })
      }
    },
    triggers: [PREFETCH_TRIGGERS.VIEW_EDGE_APP],
    cache: CACHE_TYPE.GLOBAL,
    options: {
      meta: { persist: false }
    }
  })

  // Edge Applications list prefetch (useful on login)
  registerPrefetch('edge-app:list', {
    queryFn: (params) => {
      const { edgeAppService } = params

      // Generate the query key in the EXACT same format as listEdgeApplicationsService
      // This ensures the prefetched data will be reused
      // IMPORTANT: The ListView uses defaultOrderingFieldName: '-last_modified'
      // so we must include it here for cache hit
      const queryKey = edgeAppKeys.list({
        page: 1,
        pageSize: CONFIG.LIST.PAGE_SIZE,
        ordering: '-last_modified' // Must match the default ordering in ListView
      })

      return {
        queryKey,
        queryFn: () =>
          edgeAppService.listEdgeAppService({
            page: 1,
            pageSize: CONFIG.LIST.PAGE_SIZE,
            ordering: '-last_modified',
            fields: CONFIG.LIST.FIELDS
          })
      }
    },
    triggers: [PREFETCH_TRIGGERS.LOGIN],
    cache: CACHE_TYPE.GLOBAL,
    options: TABLE_FIRST_PAGE_OPTIONS
  })
}
