/**
 * Base Query System - Entry Point
 * 
 * Exports all components of the base query system
 */

// Core
export { BaseService, createReactiveQueryKey } from './baseService'
export { queryClient, getCacheOptions, createQueryKey, clearCacheByType, clearCacheSensitive, clearAllCache } from './queryClient'
export { getMutex, coalesceRequest } from './concurrency'

// Prefetch System
export {
  PREFETCH_TRIGGERS,
  registerPrefetch,
  prefetch,
  prefetchMany,
  prefetchByTrigger,
  registerPrefetchModule
} from './prefetch'

// Config
export { CACHE_TYPE, CACHE_TIME, DEFAULT_OPTIONS, GLOBAL_OPTIONS, SENSITIVE_OPTIONS, NO_CACHE_OPTIONS, TABLE_FIRST_PAGE_OPTIONS, TABLE_PAGINATION_OPTIONS, PERSISTENCE_CONFIG } from './config'

// Plugin
export { queryPlugin, waitForPersistenceRestore } from './queryPlugin'

