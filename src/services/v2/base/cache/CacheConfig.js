export const CACHE_TYPES = {
  GLOBAL_PERSISTENT: 'global.persistent',
  USER_PERSISTENT: 'user.persistent'
}

export const cacheConfigs = {
  [CACHE_TYPES.GLOBAL_PERSISTENT]: {
    persistent: true,
    ttl: 24 * 60 * 60 * 1000,
    type: 'global_persistent'
  },
  
  [CACHE_TYPES.USER_PERSISTENT]: {
    persistent: true,
    ttl: 12 * 60 * 60 * 1000,
    type: 'user_persistent'
  }
}

export function getCacheConfig(type) {
  return cacheConfigs[type] || cacheConfigs[CACHE_TYPES.USER_PERSISTENT]
}