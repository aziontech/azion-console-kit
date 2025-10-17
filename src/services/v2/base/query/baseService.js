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
    await waitForPersistence()
    
    const queryKey = createQueryKey(key, cache)
    const options = getCacheOptions(cache)

    const cachedData = this.queryClient.getQueryData(queryKey)
    
    if (cachedData !== undefined) {
      const query = this.queryClient.getQueryState(queryKey)
      
      if (query && query.dataUpdatedAt) {
        const staleTime = options.staleTime || 0
        const isStale = (Date.now() - query.dataUpdatedAt) > staleTime
        
        if (!isStale) {
          return Promise.resolve(cachedData)
        }
      }
    }

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

  getCachedData({ key, cache = this.cacheType.GLOBAL }) {
    const queryKey = createQueryKey(key, cache)
    return this.queryClient.getQueryData(queryKey)
  }

}
