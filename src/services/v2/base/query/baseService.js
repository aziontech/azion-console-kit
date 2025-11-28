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
    const { persist = true, cacheType = this.cacheType.GLOBAL, ...restOptions } = options

    const queryOptions = { meta: { persist, cacheType }, ...getCacheOptions(cacheType) }

    return { ...queryOptions, ...restOptions }
  }

  _createQuery(queryKey, queryFn, options = {}) {
    const queryOptions = this.#getQueryOptions(options)

    return useQuery({ queryKey: createFinalKey(queryKey), queryFn, ...queryOptions })
  }

  _createMutation(mutationFn, options = {}) {
    const {
      invalidateKeysSuccess = [],
      invalidateKeysError = [],
      invalidateKeysSettled = []
    } = options

    const invalidateKeys = (invalidate) => {
      invalidate.forEach((key) => {
        this.queryClient.invalidateQueries({ queryKey: key })
      })
    }

    return useMutation({
      mutationFn,
      ...options,
      async onSuccess(data, variables, context) {
        if (options.onSuccess) {
          await options.onSuccess(data, variables, context)
        }
        if (invalidateKeysSuccess.length > 0) {
          invalidateKeys(invalidateKeysSuccess)
        }
      },
      onError(error, variables, context) {
        if (options.onError) {
          options.onError(error, variables, context)
        }
        if (invalidateKeysError.length > 0) {
          invalidateKeys(invalidateKeysError)
        }
      },
      onSettled(data, error, variables, context) {
        if (options.onSettled) {
          options.onSettled(data, error, variables, context)
        }
        if (invalidateKeysSettled.length > 0) {
          invalidateKeys(invalidateKeysSettled)
        }
      },
      ...options
    })
  }

  async _prefetchQuery(queryKey, queryFn, options = {}) {
    const queryOptions = this.#getQueryOptions(options)

    await waitForPersistenceRestore()

    return this.queryClient.prefetchQuery({
      queryKey: createFinalKey(queryKey),
      queryFn,
      ...queryOptions
    })
  }

  async _ensureQueryData(queryKey, queryFn, options = {}) {
    const queryOptions = this.#getQueryOptions(options)

    await waitForPersistenceRestore()

    return this.queryClient.ensureQueryData({ queryKey, queryFn, ...queryOptions })
  }
}
