import { useQuery } from '@tanstack/vue-query'
import { httpService } from '@/services/v2/base/http/httpService'
import {
  queryClient,
  getCacheOptions,
  createQueryKey,
  clearCacheByType,
  clearCacheSensitive,
  clearAllCache
} from '@/services/v2/base/query/queryClient'
import { CACHE_TYPE, CACHE_TIME } from '@/services/v2/base/query/config'
import { waitForPersistenceRestore } from '@/services/v2/base/query/queryPlugin'
import { getMutex, coalesceRequest } from '@/services/v2/base/query/concurrency'

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
    const coalescedQueryFn = coalesceRequest(queryKey, queryFn)

    return useQuery({
      queryKey,
      queryFn: coalescedQueryFn,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      retry: 1,
      ...options,
      ...overrides
    })
  }

  async queryAsync({ key, queryFn, cache = this.cacheType.GLOBAL, overrides = {} }) {
    await waitForPersistenceRestore()

    const queryKey = createQueryKey(key, cache)
    const options = getCacheOptions(cache)
    const coalescedQueryFn = coalesceRequest(queryKey, queryFn)

    return this.queryClient.ensureQueryData({
      queryKey,
      queryFn: coalescedQueryFn,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      retry: 1,
      ...options,
      ...overrides
    })
  }

  withMutex(key, mutationFn) {
    const mutex = getMutex(key)
    return (variables) => mutex.run(() => mutationFn(variables))
  }

  async clearByType(cache = this.cacheType.GLOBAL) {
    return clearCacheByType(cache)
  }

  async clearSensitive() {
    return clearCacheSensitive()
  }

  async clearAll() {
    return clearAllCache()
  }

  hasFreshCache({ key, cache = this.cacheType.GLOBAL }) {
    const queryKey = createQueryKey(key, cache)
    const options = getCacheOptions(cache)

    const cachedData = this.queryClient.getQueryData(queryKey)
    if (cachedData === undefined) return false

    const query = this.queryClient.getQueryState(queryKey)
    if (!query || !query.dataUpdatedAt) return false

    const staleTime = options.staleTime || 0
    const isStale = Date.now() - query.dataUpdatedAt > staleTime

    return !isStale
  }

  getCachedData({ key, cache = this.cacheType.GLOBAL }) {
    const queryKey = createQueryKey(key, cache)
    return this.queryClient.getQueryData(queryKey)
  }
}
