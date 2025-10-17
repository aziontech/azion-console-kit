import { useQuery } from '@tanstack/vue-query'
import { httpService } from '@/services/v2/base/http/httpService'
import { queryClient, getCacheOptions, createQueryKey, waitForPersistence } from '@/services/v2/base/query/queryClient'
import { CACHE_TYPE, CACHE_TIME } from '@/services/v2/base/query/config'

export class BaseService {
  constructor() {
    if (this.constructor.instance) return this.constructor.instance

    this.cacheTime = CACHE_TIME
    this.cacheType = CACHE_TYPE
    this.http = httpService
    this.queryClient = queryClient

    this.constructor.instance = this
  }

  useQuery({ key, queryFn, cache = this.cacheType.GLOBAL, overrides = {} }) {
    const queryKey = createQueryKey(key, cache)
    const options = getCacheOptions(cache)

    return useQuery({
      queryKey,
      queryFn,
      ...options,
      ...overrides
    })
  }

  async queryAsync({ key, queryFn, cache = this.cacheType.GLOBAL, overrides = {} }) {
    // Wait for persistence to be initialized
    await waitForPersistence()
    
    const queryKey = createQueryKey(key, cache)
    const options = getCacheOptions(cache)

    // Check if we have cached data first
    const cachedData = this.queryClient.getQueryData(queryKey)
    
    if (cachedData !== undefined) {
      // Check if the cached data is still fresh based on staleTime
      const query = this.queryClient.getQueryState(queryKey)
      
      if (query && query.dataUpdatedAt) {
        const staleTime = options.staleTime || 0
        const isStale = (Date.now() - query.dataUpdatedAt) > staleTime
        
        if (!isStale) {
          // Return cached data if it's still fresh
          return Promise.resolve(cachedData)
        }
      }
    }

    // If no cache or cache is stale, fetch new data
    return this.queryClient.fetchQuery({
      queryKey,
      queryFn,
      ...options,
      ...overrides
    })
  }

  async clearByType(cache = this.cacheType.GLOBAL) {
    return this.queryClient.removeQueries({
      predicate: (query) => query.queryKey[0] === cache
    })
  }

  async clearAll() {
    return this.queryClient.clear()
  }

  // Check if query has fresh cached data
  hasFreshCache({ key, cache = this.cacheType.GLOBAL }) {
    const queryKey = createQueryKey(key, cache)
    const options = getCacheOptions(cache)
    
    const cachedData = this.queryClient.getQueryData(queryKey)
    if (cachedData === undefined) return false
    
    const query = this.queryClient.getQueryState(queryKey)
    if (!query || !query.dataUpdatedAt) return false
    
    const staleTime = options.staleTime || 0
    const isStale = (Date.now() - query.dataUpdatedAt) > staleTime
    
    return !isStale
  }

  // Get cached data without triggering a fetch
  getCachedData({ key, cache = this.cacheType.GLOBAL }) {
    const queryKey = createQueryKey(key, cache)
    return this.queryClient.getQueryData(queryKey)
  }

}
