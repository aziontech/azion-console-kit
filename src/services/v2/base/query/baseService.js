import { useQuery, useMutation } from '@tanstack/vue-query'
import { httpService } from '@/services/v2/base/http/httpService'
import { queryClient } from './queryClient'
import { createFinalKey } from './keyFactory'
import { CACHE_TYPE, getCacheOptions } from './queryOptions'
import { waitForPersistenceRestore } from '@/services/v2/base/query/queryPlugin'
import { toMilliseconds } from './config'

export class BaseService {
  http = httpService
  queryClient = queryClient
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

    const { persist = true, cacheType = this.cacheType.GLOBAL, ...restOptions } = options || {}

    const queryOptions = { meta: { persist, cacheType }, ...getCacheOptions(cacheType) }

    return { ...queryOptions, ...(restOptions || {}) }
  }

  _createQuery(queryKey, queryFn, options = {}) {
    try {
      const queryOptions = this.#getQueryOptions(options)
      const finalKey = createFinalKey(queryKey)

      return useQuery({ queryKey: finalKey, queryFn, ...queryOptions })
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[TanStack Query] Error creating query:', error)
      // eslint-disable-next-line no-console
      console.error('[TanStack Query] Returning fallback query with empty data to prevent UI crash')

      return useQuery({
        queryKey: ['__error_fallback__', Date.now()],
        queryFn: async () => {
          // eslint-disable-next-line no-console
          console.warn(
            '[TanStack Query] Using fallback empty data due to configuration error',
            error
          )
          return null
        },
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

      return this.queryClient.prefetchQuery({
        queryKey: createFinalKey(queryKey),
        queryFn,
        ...queryOptions
      })
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[TanStack Query] Error prefetching query:', error)
      return Promise.resolve(null)
    }
  }

  async _ensureQueryData(queryKey, queryFn, options = {}) {
    try {
      const queryOptions = this.#getQueryOptions(options)

      await waitForPersistenceRestore()

      return this.queryClient.ensureQueryData({
        queryKey: createFinalKey(queryKey),
        queryFn,
        ...queryOptions
      })
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[TanStack Query] Error ensuring query data:', error)
      return Promise.resolve(null)
    }
  }
}
