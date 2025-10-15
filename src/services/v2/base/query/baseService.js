import { useQuery } from '@tanstack/vue-query'
import { httpService } from '@/services/v2/base/http/httpService'
import { queryClient, getCacheOptions, createQueryKey } from '@/services/v2/base/query/queryClient'
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

  // For programmatic queries (outside Vue components)
  async queryAsync({ key, queryFn, cache = this.cacheType.GLOBAL, overrides = {} }) {
    const queryKey = createQueryKey(key, cache)
    const options = getCacheOptions(cache)

    return this.queryClient.fetchQuery({
      queryKey,
      queryFn,
      ...options,
      ...overrides
    })
  }

  // Invalidate specific query
  async invalidate({ key, cache = this.cacheType.GLOBAL }) {
    const queryKey = createQueryKey(key, cache)
    return this.queryClient.invalidateQueries({ queryKey })
  }

  // Invalidate all queries by cache type
  async invalidateByType(cache = this.cacheType.GLOBAL) {
    return this.queryClient.invalidateQueries({
      predicate: (query) => query.queryKey[0] === cache
    })
  }

  // Clear all queries by cache type
  async clearByType(cache = this.cacheType.GLOBAL) {
    return this.queryClient.removeQueries({
      predicate: (query) => query.queryKey[0] === cache
    })
  }

  // Clear all queries
  async clearAll() {
    return this.queryClient.clear()
  }

  // Get cached data without triggering a fetch
  getQueryData({ key, cache = this.cacheType.GLOBAL }) {
    const queryKey = createQueryKey(key, cache)
    return this.queryClient.getQueryData(queryKey)
  }

  // Set query data manually
  setQueryData({ key, data, cache = this.cacheType.GLOBAL }) {
    const queryKey = createQueryKey(key, cache)
    return this.queryClient.setQueryData(queryKey, data)
  }
}
