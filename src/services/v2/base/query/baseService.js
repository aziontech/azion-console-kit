import { onUnmounted } from 'vue'
import { httpService } from '@/services/v2/base/http/httpService'
import { globalKey, sensitiveKey } from '@/services/v2/base/query/keys'
import {
  CACHE_TYPE,
  CACHE_TIME,
  GLOBAL_OPTIONS,
  SENSITIVE_OPTIONS
} from '@/services/v2/base/query/config'
import { queryClient } from '@/services/v2/base/query/queryClient'

export class BaseService {
  constructor() {
    if (this.constructor.instance) return this.constructor.instance

    this.cacheTime = CACHE_TIME
    this.cacheType = CACHE_TYPE
    this.http = httpService
    this.queryClient = queryClient

    this.constructor.instance = this
  }

  query({ key, queryFn, cache = this.cacheType.GLOBAL, overrides = {} }) {
    const { queryKey, baseOptions } = this.#resolveOptions({ key, cache })
    const result = this.queryClient.query({
      queryKey,
      queryFn,
      ...baseOptions,
      ...overrides
    })

    onUnmounted(() => {
      this.queryClient.unregister(queryKey, result)
    })

    return result
  }

  async queryAsync({ key, queryFn, cache = this.cacheType.GLOBAL, overrides = {} }) {
    const { queryKey, baseOptions } = this.#resolveOptions({ key, cache })
    return this.queryClient.queryAsync({
      queryKey,
      queryFn,
      ...baseOptions,
      ...overrides
    })
  }

  async invalidate({ key, cache = this.cacheType.GLOBAL }) {
    const { queryKey } = this.#resolveOptions({ key, cache })
    return this.queryClient.invalidate(queryKey)
  }

  async invalidateByType(cache = this.cacheType.GLOBAL) {
    return this.queryClient.clearByPrefix(cache)
  }

  #resolveOptions({ key, cache }) {
    switch (cache) {
      case this.cacheType.SENSITIVE:
        return {
          queryKey: sensitiveKey(key),
          baseOptions: SENSITIVE_OPTIONS
        }
      case this.cacheType.GLOBAL:
        return {
          queryKey: globalKey(key),
          baseOptions: GLOBAL_OPTIONS
        }
      case this.cacheType.NONE:
      default:
        return {
          queryKey: key.join(':'),
          baseOptions: { staleTime: 0, gcTime: 0, encrypted: false }
        }
    }
  }
}
