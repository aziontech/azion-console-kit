import { QueryClient } from '@tanstack/vue-query'
import {
  DEFAULT_OPTIONS,
  GLOBAL_OPTIONS,
  SENSITIVE_OPTIONS,
  NO_CACHE_OPTIONS,
  CACHE_TYPE
} from './config'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      ...DEFAULT_OPTIONS
    },
    mutations: {
      ...DEFAULT_OPTIONS
    }
  }
})

export const getCacheOptions = (cacheType) => {
  switch (cacheType) {
    case CACHE_TYPE.SENSITIVE:
      return SENSITIVE_OPTIONS
    case 'NONE':
      return NO_CACHE_OPTIONS
    case CACHE_TYPE.GLOBAL:
    default:
      return GLOBAL_OPTIONS
  }
}

export const createQueryKey = (key, cacheType) => {
  if (typeof key === 'function') {
    return () => [cacheType, ...key()]
  }
  return [cacheType, ...key]
}

export const clearCacheByType = async (cacheType) => {
  await queryClient.removeQueries({
    predicate: (query) => query.queryKey[0] === cacheType
  })
}

export const clearCacheSensitive = async () => {
  await clearCacheByType(CACHE_TYPE.SENSITIVE)
}

export const clearAllCache = async () => {
  queryClient.clear()
}

export default queryClient
