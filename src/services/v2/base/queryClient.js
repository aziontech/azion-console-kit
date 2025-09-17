import { QueryClient } from '@tanstack/vue-query'
import { errorHandler } from '@/services/v2/utils'

// Time constants (in milliseconds)
const STALE_TIME_MS = 300000 // 5 minutes
const CACHE_TIME_MS = 600000 // 10 minutes
const RETRY_DELAY_BASE_MS = 1000 // 1 second
const MAX_RETRY_DELAY_MS = 30000 // 30 seconds

// Retry constants
const QUERY_RETRY_COUNT = 2
const MUTATION_RETRY_COUNT = 1

// Retry delay calculation function
const calculateRetryDelay = (attempt) => {
  const RETRY_EXPONENTIAL_BASE = 2
  const exponentialDelay = RETRY_DELAY_BASE_MS * Math.pow(RETRY_EXPONENTIAL_BASE, attempt)
  return Math.min(exponentialDelay, MAX_RETRY_DELAY_MS)
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: STALE_TIME_MS,
      gcTime: CACHE_TIME_MS,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      retry: QUERY_RETRY_COUNT,
      retryDelay: calculateRetryDelay,
      placeholderData: (previousData) => previousData
    },
    mutations: {
      retry: MUTATION_RETRY_COUNT,
      onError: (err) => errorHandler(err)
    },
    onError: (err) => errorHandler(err)
  }
})
