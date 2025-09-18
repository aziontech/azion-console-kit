import { QueryClient, useQuery } from '@tanstack/vue-query'

// ============================================================================
// SIMPLE PERSISTENCE SYSTEM
// ============================================================================
const CACHE_PREFIX = 'azion_cache_'

// Auto-detect if data should be global (persist across users)
const isGlobalData = (queryKey) => {
  const key = Array.isArray(queryKey) ? queryKey[1] : queryKey
  return key === 'global' || key === 'solutions' || key === 'marketplace'
}

// Helper function to serialize queryKey properly
const serializeQueryKey = (queryKey) => {
  if (Array.isArray(queryKey)) {
    return queryKey
      .map((item) =>
        typeof item === 'object' && item !== null ? JSON.stringify(item) : String(item)
      )
      .join('_')
  }
  return String(queryKey)
}

// Simple cache operations
const saveToCache = (queryKey, data) => {
  try {
    const key = serializeQueryKey(queryKey)
    const cacheKey = `${CACHE_PREFIX}${key}`
    const isGlobal = isGlobalData(queryKey)

    const cacheData = {
      data,
      timestamp: Date.now(),
      isGlobal
    }

    localStorage.setItem(cacheKey, JSON.stringify(cacheData))
  } catch (error) {
    // Silent fail - cache is optional
  }
}

const loadFromCache = (queryKey) => {
  try {
    const key = serializeQueryKey(queryKey)
    const cacheKey = `${CACHE_PREFIX}${key}`
    const cached = localStorage.getItem(cacheKey)

    if (!cached) return null

    const { data, timestamp } = JSON.parse(cached)

    // Cache expires after 24 hours
    if (Date.now() - timestamp > 24 * 60 * 60 * 1000) {
      localStorage.removeItem(cacheKey)
      return null
    }

    return data
  } catch (error) {
    return null
  }
}

// ============================================================================
// QUERY CLIENT WITH AUTO-PERSISTENCE
// ============================================================================
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: 2,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true
    },
    mutations: {
      retry: 1
    }
  }
})

// Auto-save successful queries to cache
queryClient.getQueryCache().subscribe((event) => {
  if (event.type === 'updated' && event.query.state.status === 'success') {
    const { queryKey, state } = event.query
    if (state.data) {
      saveToCache(queryKey, state.data)
    }
  }
})

// ============================================================================
// ENHANCED QUERY CLIENT WITH AUTO-CACHE
// ============================================================================
export const enhancedQueryClient = {
  ...queryClient,

  useQuery: (options) => {
    const { queryKey, queryFn, ...restOptions } = options

    const cached = loadFromCache(queryKey)

    return useQuery({
      queryKey,
      queryFn,
      ...(cached && { initialData: cached }),
      ...restOptions
    })
  }
}

// ============================================================================
// SIMPLE CACHE UTILITIES
// ============================================================================
export const cacheUtils = {
  clear: () => {
    const keys = Object.keys(localStorage)
    keys
      .filter((key) => key.startsWith(CACHE_PREFIX))
      .forEach((key) => localStorage.removeItem(key))
  },

  clearGlobal: () => {
    const keys = Object.keys(localStorage)
    keys
      .filter((key) => key.startsWith(CACHE_PREFIX))
      .forEach((key) => {
        try {
          const cached = localStorage.getItem(key)
          const { isGlobal } = JSON.parse(cached)
          if (isGlobal) localStorage.removeItem(key)
        } catch {
          // Remove corrupted cache
          localStorage.removeItem(key)
        }
      })
  }
}
