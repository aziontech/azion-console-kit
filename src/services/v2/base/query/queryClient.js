import { QueryClient } from '@tanstack/vue-query'
import { indexedDbPersister } from './indexedDbPersister'
import { GLOBAL_OPTIONS, SENSITIVE_OPTIONS, NO_CACHE_OPTIONS } from './config'

// Create the query client with default options
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

// Initialize persistence
export async function initializeQueryPersistence() {
  try {
    // Run quick test
    const quickTest = await indexedDbPersister.quickTest()

    // Make test results available globally for debugging
    window.queryPersistenceTest = quickTest

    // Restore cached queries
    const restoredQueries = await indexedDbPersister.restoreClient()
    if (restoredQueries && Array.isArray(restoredQueries)) {
      restoredQueries.forEach((query) => {
        if (query.queryKey && query.state) {
          queryClient.setQueryData(query.queryKey, query.state.data)
        }
      })
    }

    // Set up automatic persistence on cache changes
    queryClient.getQueryCache().subscribe((event) => {
      if (event.type === 'updated' || event.type === 'added') {
        const query = event.query
        if (query && query.queryKey && query.state.data !== undefined) {
          indexedDbPersister.persistQuery(query.queryKey, query.state.data)
        }
      }
    })
  } catch (error) {
    // Failed to initialize query persistence
  }
}

// Helper function to get cache options based on type
export function getCacheOptions(cacheType) {
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

// Helper function to create query keys with prefixes
export const createQueryKey = (key, cacheType = 'GLOBAL') => {
  return [cacheType, ...key]
}

export default queryClient
