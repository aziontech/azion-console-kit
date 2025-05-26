const CACHE_BEHAVIOR_LABELS = {
  honor: 'Honor Origin Cache Headers',
  override: 'Override Cache Settings',
  'no-cache': 'No Cache'
}

const formatCacheBehavior = (value) => CACHE_BEHAVIOR_LABELS[value] || value

const parseContentToTextArea = (arr) => arr?.join('\n') ?? ''
const parseTextToArray = (text) => text?.split('\n') ?? []
const parseDeviceGroups = (ids) => ids?.map((id) => ({ id })) ?? []
const parseDeviceGroup = (group) => group?.map(({ id }) => id) ?? []

export const CacheSettingAdapter = {
  requestPayload(payload) {
    return {
      name: payload.name,
      browser_cache: {
        behavior: payload.browserCacheSettings,
        max_age: payload.browserCacheSettingsMaximumTtl
      },
      edge_cache: {
        behavior: payload.cdnCacheSettings,
        max_age: payload.cdnCacheSettingsMaximumTtl,
        caching_for_post_enabled: payload.enableCachingForPost,
        caching_for_options_enabled: payload.enableCachingForOptions,
        stale_cache_enabled: payload.enableStaleCache,
        tiered_cache_enabled: payload.l2CachingEnabled,
        tiered_cache_region: payload.l2CachingEnabled
          ? payload.l2Region ?? 'na-united-states'
          : undefined
      },
      application_controls: {
        cache_by_query_string: payload.cacheByQueryString,
        query_string_fields: parseTextToArray(payload.queryStringFields),
        query_string_sort_enabled: payload.enableQueryStringSort,
        cache_by_cookies: payload.cacheByCookies,
        cookie_names: parseTextToArray(payload.cookieNames),
        adaptive_delivery_action: payload.adaptiveDeliveryAction,
        device_group: parseDeviceGroup(payload.deviceGroup)
      },
      slice_controls: {
        slice_configuration_enabled: payload.sliceConfigurationEnabled,
        slice_edge_caching_enabled: payload.isSliceEdgeCachingEnabled,
        slice_tiered_caching_enabled: payload.isSliceL2CachingEnabled,
        slice_configuration_range: payload.sliceConfigurationRange
      }
    }
  },

  transformListCacheSetting(data) {
    return data.map((item) => ({
      id: String(item.id),
      name: item.name,
      browserCache: formatCacheBehavior(item.browser_cache.behavior),
      cdnCache: formatCacheBehavior(item.edge_cache.behavior)
    }))
  },

  transformLoadCacheSetting({ data }) {
    const controls = data.application_controls
    const edge = data.edge_cache
    const slice = data.slice_controls

    return {
      id: data.id,
      name: data.name,
      browserCacheSettings: data.browser_cache.behavior,
      browserCacheSettingsMaximumTtl: data.browser_cache.max_age,
      cdnCacheSettings: edge.behavior,
      cdnCacheSettingsMaximumTtl: edge.max_age,
      enableCachingForPost: edge.caching_for_post_enabled,
      enableCachingForOptions: edge.caching_for_options_enabled,
      enableStaleCache: edge.stale_cache_enabled,
      l2CachingEnabled: edge.tiered_cache_enabled,
      l2Region: edge.tiered_cache_region,
      cacheByQueryString: controls.cache_by_query_string,
      queryStringFields: parseContentToTextArea(controls.query_string_fields),
      enableQueryStringSort: controls.query_string_sort_enabled,
      cacheByCookies: controls.cache_by_cookies,
      cookieNames: parseContentToTextArea(controls.cookie_names),
      adaptiveDeliveryAction: controls.adaptive_delivery_action,
      deviceGroup: parseDeviceGroups(controls.device_group),
      sliceConfigurationEnabled: slice.slice_configuration_enabled,
      sliceConfigurationRange: slice.slice_configuration_range,
      isSliceEdgeCachingEnabled: slice.slice_edge_caching_enabled,
      isSliceL2CachingEnabled: slice.slice_tiered_caching_enabled
    }
  }
}
