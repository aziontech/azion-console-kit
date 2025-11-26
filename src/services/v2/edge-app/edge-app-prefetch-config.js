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
  const tableDefinitions = localStorage.getItem('tableDefinitions')
  if (tableDefinitions) {
    const parsed = JSON.parse(tableDefinitions)
    const numberOfLinesPerPage = parsed?.numberOfLinesPerPage
    if (numberOfLinesPerPage && typeof numberOfLinesPerPage === 'number') {
      return numberOfLinesPerPage
    }
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

  registerPrefetch('edge-app:list', {
    queryFn: (params) => {
      const { edgeAppService } = params

      const queryKey = edgeAppKeys.list({
        page: 1,
        pageSize: CONFIG.LIST.PAGE_SIZE,
        ordering: '-last_modified'
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
