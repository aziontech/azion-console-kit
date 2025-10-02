const CACHE_BEHAVIOR_LABELS = {
  honor: 'Honor Origin Cache Headers',
  override: 'Override Cache Settings',
  'no-cache': 'No Cache'
}

const formatCacheBehavior = (value) => CACHE_BEHAVIOR_LABELS[value] || value

const parseContentToTextArea = (arr) => arr?.join('\n') ?? ''
const parseTextToArray = (text) => text?.split('\n') ?? []

export const CacheSettingsAdapter = {
  requestPayload(payload) {
    const result = {
      name: payload.name,
      browser_cache: {
        behavior: payload.browserCacheSettings || 'honor',
        max_age: payload.browserCacheSettingsMaximumTtl || 0
      },
      modules: {
        cache: {
          behavior: payload.cdnCacheSettings || 'honor',
          max_age: payload.cdnCacheSettingsMaximumTtl || 60,
          stale_cache: {
            enabled: payload.enableStaleCache || false
          },
          large_file_cache: {
            enabled: payload.enableLargeFileCache || false,
            offset: payload.largeFileCacheOffset || 1024
          }
        }
      }
    }
    if (payload.tieredCache) {
      result.modules.cache.tiered_cache = {
        enabled: payload.tieredCache,
        topology: payload.tieredCacheRegion
      }
    } else {
      result.modules.cache.tiered_cache = null
    }

    if (result.browser_cache.behavior === 'honor') {
      result.browser_cache.max_age = 0
    }

    // Add application_accelerator module if any of its features are used
    const hasAppAccelerator =
      payload.enableCachingForPost ||
      payload.enableCachingForOptions ||
      payload.cacheByQueryString !== 'ignore' ||
      payload.cacheByCookies !== 'ignore' ||
      payload.adaptiveDeliveryAction !== 'ignore'

    if (hasAppAccelerator) {
      const appAccelerator = {}

      // Cache vary by method
      const cacheVaryByMethod = []
      if (payload.enableCachingForOptions) cacheVaryByMethod.push('options')
      if (payload.enableCachingForPost) cacheVaryByMethod.push('post')
      if (cacheVaryByMethod.length > 0) {
        appAccelerator.cache_vary_by_method = cacheVaryByMethod
      }

      // Cache vary by querystring
      if (payload.cacheByQueryString && payload.cacheByQueryString !== 'ignore') {
        let fields = []
        if (payload.cacheByQueryString !== 'all') {
          fields = parseTextToArray(payload.queryStringFields)
        }
        appAccelerator.cache_vary_by_querystring = {
          behavior: payload.cacheByQueryString,
          fields,
          sort_enabled: payload.enableQueryStringSort !== false
        }
      }

      // Cache vary by cookies
      if (payload.cacheByCookies && payload.cacheByCookies !== 'ignore') {
        let cookieNames = []
        if (payload.cacheByCookies !== 'all') {
          cookieNames = parseTextToArray(payload.cookieNames)
        }
        appAccelerator.cache_vary_by_cookies = {
          behavior: payload.cacheByCookies,
          cookie_names: cookieNames
        }
      }

      // Cache vary by devices
      if (payload.adaptiveDeliveryAction && payload.adaptiveDeliveryAction !== 'ignore') {
        appAccelerator.cache_vary_by_devices = {
          behavior: payload.adaptiveDeliveryAction,
          device_group: payload.deviceGroup || []
        }
      }

      if (Object.keys(appAccelerator).length > 0) {
        result.modules.application_accelerator = appAccelerator
      }
    }

    return result
  },

  transformListCacheSetting(data) {
    return data.map((item) => ({
      id: String(item.id),
      name: item.name,
      browserCache: formatCacheBehavior(item.browser_cache?.behavior || 'honor'),
      cdnCache: formatCacheBehavior(item.modules?.cache?.behavior || 'honor')
    }))
  },

  transformLoadCacheSetting({ data }) {
    const edge = data.modules?.edge_cache || {}
    const tieredCache = data.modules?.cache?.tiered_cache.enabled

    const appAccelerator = data.modules?.application_accelerator || {}
    const browserCache = data.browser_cache || {}

    // Extract cache vary by method settings
    const cacheVaryByMethod = appAccelerator.cache_vary_by_method || []
    const enableCachingForPost = cacheVaryByMethod.includes('post')
    const enableCachingForOptions = cacheVaryByMethod.includes('options')

    // Extract cache vary by querystring settings
    const cacheVaryByQuerystring = appAccelerator.cache_vary_by_querystring || {}
    const cacheByQueryString = cacheVaryByQuerystring.behavior || 'ignore'
    const queryStringFields = parseContentToTextArea(cacheVaryByQuerystring.fields || [])
    const enableQueryStringSort = cacheVaryByQuerystring.sort_enabled !== false

    // Extract cache vary by cookies settings
    const cacheVaryByCookies = appAccelerator.cache_vary_by_cookies || {}
    const cacheByCookies = cacheVaryByCookies.behavior || 'ignore'
    const cookieNames = parseContentToTextArea(cacheVaryByCookies.cookie_names || [])

    // Extract cache vary by devices settings
    const cacheVaryByDevices = appAccelerator.cache_vary_by_devices || {}
    const adaptiveDeliveryAction = cacheVaryByDevices.behavior || 'ignore'

    return {
      id: data.id,
      name: data.name,
      browserCacheSettings: browserCache.behavior || 'honor',
      browserCacheSettingsMaximumTtl: browserCache.max_age || 0,
      cdnCacheSettings: edge.behavior || 'honor',
      cdnCacheSettingsMaximumTtl: edge.max_age || 60,
      enableCachingForPost,
      enableCachingForOptions,
      enableStaleCache: edge.stale_cache?.enabled || false,
      enableLargeFileCache: edge.large_file_cache?.enabled || false,
      largeFileCacheOffset: edge.large_file_cache?.offset || 1024,
      tieredCache: !!tieredCache,
      tieredCacheRegion: tieredCache?.topology || 'global',

      cacheByQueryString,
      queryStringFields,
      enableQueryStringSort,
      cacheByCookies,
      cookieNames,
      adaptiveDeliveryAction,
      deviceGroup: cacheVaryByDevices.device_group || []
    }
  }
}
