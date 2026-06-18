import { createVersionedSubResourceService } from '@/services/v2/edge-app/versioned/create-versioned-sub-resource-service'
import { CacheSettingsAdapter } from '@/services/v2/edge-app/edge-app-cache-settings-adapter'
import { queryKeys } from '@/services/v2/base/query/queryKeys'

export const versionedCacheSettingsService = createVersionedSubResourceService({
  path: 'cache_settings',
  adapter: {
    transformList: (results) => CacheSettingsAdapter.transformListCacheSetting(results),
    transformLoad: (data) => CacheSettingsAdapter.transformLoadCacheSetting(data),
    requestPayload: (payload) => CacheSettingsAdapter.requestPayload(payload)
  },
  queryKeyGroup: queryKeys.application.version.cacheSettings
})
