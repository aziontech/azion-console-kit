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
    const queryKey = createQueryKey(key, cache, 'sync')
    const options = getCacheOptions(cache)

    return useQuery({
      queryKey,
      queryFn,
      ...options,
      ...overrides
    })
  }

  async queryAsync({ key, queryFn, cache = this.cacheType.GLOBAL, overrides = {} }) {
    const queryKey = createQueryKey(key, cache, 'async')
    const options = getCacheOptions(cache)

    return this.queryClient.ensureQueryData({
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
}
