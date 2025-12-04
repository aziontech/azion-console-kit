import { QueryClient } from '@tanstack/vue-query'
import { broadcastQueryClient } from '@tanstack/query-broadcast-client-experimental'
import { getCacheOptions, CACHE_TYPE } from './queryOptions'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      ...getCacheOptions()
    },
    mutations: {
      retry: 1
    }
  }
})

// Sync multi-tab
broadcastQueryClient({
  queryClient,
  broadcastChannel: 'app-azion-sync'
})

export const clearAllCache = () => {
  return queryClient.clear()
}

export const clearCacheByType = async (cacheType) => {
  await queryClient.removeQueries({
    predicate: (query) => {
      return query.meta?.cacheType === cacheType
    }
  })
}

export const clearCacheSensitive = async () => {
  await clearCacheByType(CACHE_TYPE.SENSITIVE)
}
