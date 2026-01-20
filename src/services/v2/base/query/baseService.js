import { useQuery, useMutation } from '@tanstack/vue-query'
import { httpService } from '@/services/v2/base/http/httpService'
import { queryClient } from './queryClient'
import { createFinalKey, queryKeys } from './querySystem'
import { CACHE_TYPE, getCacheOptions } from './queryOptions'
import { waitForPersistenceRestore } from '@/services/v2/base/query/queryPlugin'
import { toMilliseconds } from './config'

export class BaseService {
  http = httpService
  queryClient = queryClient
  queryKeys = queryKeys
  cacheType = CACHE_TYPE
  toMilliseconds = toMilliseconds

  #getQueryOptions(options = {}) {
    if (options && typeof options !== 'object') {
      // eslint-disable-next-line no-console
      console.error(
        '[TanStack Query] Invalid options type. Expected object, received:',
        typeof options
      )
      return {
        meta: { persist: true, cacheType: this.cacheType.GLOBAL },
        ...getCacheOptions(this.cacheType.GLOBAL)
      }
    }

    const {
      persist = true,
      cacheType = this.cacheType.GLOBAL,
      skipCache = false,
      ...restOptions
    } = options || {}

    const queryOptions = { meta: { persist, cacheType, skipCache }, ...getCacheOptions(cacheType) }

    return { ...queryOptions, ...(restOptions || {}) }
  }

  _createQuery(queryKey, queryFn, options = {}) {
    try {
      const queryOptions = this.#getQueryOptions(options)
      const finalKey = createFinalKey(queryKey)
      return useQuery({ queryKey: finalKey, queryFn, ...queryOptions })
    } catch {
      return useQuery({
        queryKey: ['__error_fallback__', Date.now()],
        queryFn: async () => null,
        initialData: null,
        staleTime: this.toMilliseconds({ seconds: 30 }),
        gcTime: this.toMilliseconds({ minutes: 1 }),
        retry: false,
        refetchOnMount: false,
        refetchOnWindowFocus: false
      })
    }
  }

  _createMutation(mutationFn, options = {}) {
    const {
      invalidateKeysSuccess = [],
      invalidateKeysError = [],
      invalidateKeysSettled = []
    } = options || {}

    const invalidateKeys = (invalidate) => {
      invalidate.forEach((key) => {
        this.queryClient.invalidateQueries({ queryKey: key })
      })
    }

    return useMutation({
      mutationFn,
      async onSuccess(data, variables, context) {
        if (options?.onSuccess) {
          await options.onSuccess(data, variables, context)
        }
        if (invalidateKeysSuccess.length > 0) {
          invalidateKeys(invalidateKeysSuccess)
        }
      },
      onError(error, variables, context) {
        if (options?.onError) {
          options.onError(error, variables, context)
        }
        if (invalidateKeysError.length > 0) {
          invalidateKeys(invalidateKeysError)
        }
      },
      onSettled(data, error, variables, context) {
        if (options?.onSettled) {
          options.onSettled(data, error, variables, context)
        }
        if (invalidateKeysSettled.length > 0) {
          invalidateKeys(invalidateKeysSettled)
        }
      },
      ...(options || {})
    })
  }

  async _prefetchQuery(queryKey, queryFn, options = {}) {
    try {
      const queryOptions = this.#getQueryOptions(options)
      await waitForPersistenceRestore()

      return await this.queryClient.prefetchQuery({
        queryKey: createFinalKey(queryKey),
        queryFn,
        ...queryOptions
      })
    } catch {
      return Promise.resolve(null)
    }
  }

  async _ensureQueryData(queryKey, queryFn, options = {}) {
    try {
      const queryOptions = this.#getQueryOptions(options)
      const finalKey = createFinalKey(queryKey)

      await waitForPersistenceRestore()

      if (queryOptions.meta?.skipCache) {
        return await queryFn()
      }

      return await this.queryClient.ensureQueryData({
        queryKey: finalKey,
        queryFn,
        revalidateIfStale: true,
        ...queryOptions
      })
    } catch {
      return Promise.resolve(null)
    }
  }
}
