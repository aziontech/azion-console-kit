// src/query/baseService.js
import { useQuery } from '@tanstack/vue-query'
import { httpService } from '@/services/v2/base/http/httpService'
import { globalKey, sensitiveKey } from '@/services/v2/base/query/keys'
import {
  globalOptions,
  sensitiveOptions,
  getQueriesEnabled,
  queryClient
} from '@/services/v2/base/query/queryClient'
import { CACHE_TYPE, CACHE_TIME } from '@/services/v2/base/query/config'
import { watch } from 'vue'

export class BaseService {
  constructor() {
    if (this.constructor.instance) {
      return this.constructor.instance
    }

    this.cacheTime = CACHE_TIME
    this.cacheType = CACHE_TYPE
    this.http = httpService
    this.queryClient = queryClient
    this.constructor.instance = this
  }

  query({ key, queryFn, cache = CACHE_TYPE.GLOBAL, overrides = {} }) {
    const { queryKey, baseOptions } = this.#resolveOptions({ key, cache })

    const cached = this.queryClient.getQueryData(queryKey)
    if (cached !== undefined) {
      this.queryClient.setQueryData(queryKey, cached)
    }

    const query = useQuery({
      queryKey,
      queryFn,
      placeholderData: cached,
      ...baseOptions,
      ...overrides
    })

    watch(query.data, (val) => {
      if (val !== undefined) {
        this.queryClient.setQueryData(queryKey, val)
      }
    })

    return query
  }

  async queryAsync({ key, queryFn, cache = CACHE_TYPE.GLOBAL, overrides = {} }) {
    const { queryKey, baseOptions } = this.#resolveOptions({ key, cache })

    return this.queryClient.ensureQueryData({
      queryKey,
      queryFn,
      staleTime: CACHE_TIME.TWENTY_FOUR_HOURS,
      gcTime: CACHE_TIME.TWENTY_FOUR_HOURS,
      ...baseOptions,
      ...overrides
    })
  }

  #resolveOptions({ key, cache }) {
    switch (cache) {
      case CACHE_TYPE.SENSITIVE:
        return { queryKey: sensitiveKey(key), baseOptions: sensitiveOptions() }
      case CACHE_TYPE.GLOBAL:
        return { queryKey: globalKey(key), baseOptions: globalOptions() }
      case CACHE_TYPE.NONE:
      default:
        return {
          queryKey: key,
          baseOptions: {
            enabled: getQueriesEnabled(),
            cacheTime: 0,
            staleTime: 0
          }
        }
    }
  }
}
