import { useQuery, useMutation } from '@tanstack/vue-query'
import { computed, unref, toValue } from 'vue'
import { httpService } from '@/services/v2/base/http/httpService'
import { queryClient } from './queryClient'
import { CACHE_TYPE, CACHE_TIME, getCacheOptions } from '@/services/v2/base/query/config'

import { waitForPersistenceRestore } from '@/services/v2/base/query/queryPlugin'

export class BaseService {
  http = httpService
  queryClient = queryClient
  cacheType = CACHE_TYPE
  cacheTime = CACHE_TIME

  _createQuery(queryKey, queryFn, meta = {}, options = {}) {
    const { cacheType = CACHE_TYPE.GLOBAL, persist = true } = meta
    const cacheOptions = getCacheOptions(cacheType)

    const computedKey = computed(() => {
      const key = typeof queryKey === 'function' ? queryKey() : queryKey
      return key.map((keyItem) => toValue(keyItem))
    })

    const result = useQuery({
      queryKey: computedKey,
      queryFn,
      meta: {
        cacheType,
        persist,
        ...meta
      },
      ...cacheOptions,
      ...options
    })

    return {
      data: computed(() => unref(result.data)),
      isLoading: computed(() => unref(result.isLoading)),
      isFetching: computed(() => unref(result.isFetching)),
      isError: computed(() => unref(result.isError)),
      error: computed(() => unref(result.error)),
      isSuccess: computed(() => unref(result.isSuccess)),
      refetch: result.refetch
    }
  }

  _createMutation(mutationFn, options = {}) {
    const result = useMutation({
      mutationFn,
      ...options
    })

    return {
      mutate: result.mutate,
      mutateAsync: result.mutateAsync,
      isPending: computed(() => unref(result.isPending)),
      isError: computed(() => unref(result.isError)),
      isSuccess: computed(() => unref(result.isSuccess)),
      error: computed(() => unref(result.error)),
      data: computed(() => unref(result.data)),
      reset: result.reset
    }
  }

  async _prefetchQuery(queryKey, queryFn, meta = {}, options = {}) {
    const { cacheType = CACHE_TYPE.GLOBAL, persist = true } = meta
    const cacheOptions = getCacheOptions(cacheType)

    return this.queryClient.prefetchQuery({
      queryKey,
      queryFn,
      meta: {
        cacheType,
        persist,
        ...meta
      },
      ...cacheOptions,
      ...options
    })
  }

  async _ensureQueryData(queryKey, queryFn, meta = {}, options = {}) {
    const { cacheType = CACHE_TYPE.GLOBAL, persist = true } = meta
    const cacheOptions = getCacheOptions(cacheType)

    await waitForPersistenceRestore()
    const result = await this.queryClient.ensureQueryData({
      queryKey,
      queryFn,
      meta: {
        cacheType,
        persist,
        ...meta
      },
      ...cacheOptions,
      ...options
    })
    return result.data
  }
}
