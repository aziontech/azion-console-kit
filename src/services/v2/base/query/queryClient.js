import { QueryClient } from '@tanstack/vue-query'
import { indexedDbPersister } from './indexedDbPersister'
import { GLOBAL_OPTIONS, SENSITIVE_OPTIONS, NO_CACHE_OPTIONS } from './config'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      ...GLOBAL_OPTIONS
    },
    mutations: {
      retry: 1
    }
  }
})

let isPersistenceInitialized = false

export const initializeQueryPersistence = async () => {
  try {
    const restoredQueries = await indexedDbPersister.restoreClient()

    if (restoredQueries && Array.isArray(restoredQueries)) {
      restoredQueries.forEach((query) => {
        if (query.queryKey && query.state) {
          queryClient.setQueryData(query.queryKey, query.state.data, {
            updatedAt: Date.now()
          })
        }
      })
    }

    queryClient.getQueryCache().subscribe((event) => {
      if (event.type === 'updated' || event.type === 'added') {
        const query = event.query
        if (query && query.queryKey && query.state.data !== undefined) {
          indexedDbPersister.persistQuery(query.queryKey, query.state.data)
        }
      }
    })

    isPersistenceInitialized = true
  } catch (error) {
    throw new Error(error)
  }
}

export const waitForPersistence = async () => {
  while (!isPersistenceInitialized) {
    await new Promise((resolve) => setTimeout(resolve, 10))
  }
}

export const getCacheOptions = (cacheType) => {
  switch (cacheType) {
    case 'SENSITIVE':
      return SENSITIVE_OPTIONS
    case 'NONE':
      return NO_CACHE_OPTIONS
    case 'GLOBAL':
    default:
      return GLOBAL_OPTIONS
  }
}

export const createQueryKey = (key, cacheType = 'GLOBAL') => {
  return [cacheType, ...key]
}

export const clearCacheByType = (cacheType) => {
  return queryClient.removeQueries({
    predicate: (query) => query.queryKey[0] === cacheType
  })
}

export const clearCacheSensitive = () => {
  return queryClient.removeQueries({
    predicate: (query) => query.queryKey[0] === 'SENSITIVE'
  })
}

export const clearAllCache = () => {
  return queryClient.clear()
}

export default queryClient
