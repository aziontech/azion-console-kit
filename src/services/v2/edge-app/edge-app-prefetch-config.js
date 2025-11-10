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
import { TABLE_FIRST_PAGE_OPTIONS } from '@/services/v2/base/query/config'
import { CACHE_TYPE } from '@/services/v2/base/query/config'
import { hasFlagBlockApiV4 } from '@/composables/user-flag'

/**
 * Configuration constants
 */
const CONFIG = {
  ORIGINS: {
    PAGE_SIZE: 200,
    ORDER_BY: 'origin_id',
    SORT: 'asc'
  },
  DEVICE_GROUPS: {
    PAGE_SIZE: 10
  },
  CACHE_SETTINGS: {
    PAGE_SIZE: 100
  },
  FUNCTIONS: {
    PAGE_SIZE: 10,
    FIELDS: ['id', 'name', 'last_editor', 'last_modified', 'function']
  },
  LIST: {
    PAGE_SIZE: 10,
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
        queryFn: () => listOriginsService({
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
        queryFn: () => deviceGroupService.listDeviceGroupService(edgeApplicationId, {
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
        queryFn: () => cacheSettingsService.listCacheSettingsService(edgeApplicationId, {
          pageSize: CONFIG.CACHE_SETTINGS.PAGE_SIZE
        })
      }
    },
    triggers: [PREFETCH_TRIGGERS.VIEW_EDGE_APP],
    cache: CACHE_TYPE.GLOBAL,
    options: {
      staleTime: 10 * 60 * 1000, // 10 minutes
      gcTime: 30 * 60 * 1000 // 30 minutes
    }
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
        queryFn: () => edgeApplicationFunctionService.listEdgeApplicationFunctions(
          edgeApplicationId,
          {
            pageSize: CONFIG.FUNCTIONS.PAGE_SIZE,
            fields: CONFIG.FUNCTIONS.FIELDS
          }
        )
      }
    },
    triggers: [PREFETCH_TRIGGERS.VIEW_EDGE_APP],
    cache: CACHE_TYPE.GLOBAL,
    options: {
      staleTime: 10 * 60 * 1000, // 10 minutes
      gcTime: 30 * 60 * 1000, // 30 minutes
      enabled: (params) => {
        return params?.edgeFunctionsEnabled === true
      }
    }
  })

  // Edge Applications list prefetch (useful on login)
  registerPrefetch('edge-app:list', {
    queryFn: (params) => {
      const { edgeAppService } = params
      const queryKey = edgeAppKeys.list({ page: 1, pageSize: CONFIG.LIST.PAGE_SIZE })

      return {
        queryKey,
        queryFn: () => edgeAppService.listEdgeAppService({
          page: 1,
          pageSize: CONFIG.LIST.PAGE_SIZE,
          fields: CONFIG.LIST.FIELDS
        })
      }
    },
    triggers: [PREFETCH_TRIGGERS.LOGIN],
    cache: CACHE_TYPE.GLOBAL,
    options: TABLE_FIRST_PAGE_OPTIONS
  })
}
