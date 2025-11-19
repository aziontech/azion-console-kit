/**
 * TanStack Query Client Configuration
 * Simplified to follow v5 best practices
 *
 * Cache configuration should be done per-query, not globally.
 * Query keys should represent data hierarchy, not cache types.
 */

import { QueryClient } from '@tanstack/vue-query'

// Default query configuration
// These are sensible defaults that work for most use cases
const DEFAULT_QUERY_OPTIONS = {
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
  refetchOnMount: false,
  retry: 1,
  staleTime: 5 * 60 * 1000, // 5 minutes - reasonable default
  gcTime: 24 * 60 * 60 * 1000 // 24 hours - keep in memory
}

const DEFAULT_MUTATION_OPTIONS = {
  retry: 0 // Don't retry mutations by default
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: DEFAULT_QUERY_OPTIONS,
    mutations: DEFAULT_MUTATION_OPTIONS
  }
})

// =============================================================================
// CACHE UTILITIES
// Use these for manual cache operations when needed
// =============================================================================

/**
 * Clear all cached queries
 * Use sparingly - usually you want invalidateQueries instead
 */
export const clearAllCache = async () => {
  await queryClient.clear()
}

/**
 * Invalidate all queries
 * Marks queries as stale and triggers refetch if they're being observed
 */
export const invalidateAllQueries = async () => {
  await queryClient.invalidateQueries()
}

export default queryClient
