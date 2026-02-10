import { useQuery, useMutation } from '@tanstack/vue-query'
import { httpService } from '@/services/v2/base/http/httpService'
import { queryClient } from './queryClient'
import { queryKeys } from './queryKeys'
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
      throw new Error('Invalid options type. Expected object, received: ' + typeof options)
    }

    const cacheOptions = getCacheOptions(options.cacheType)

    const {
      cacheType = this.cacheType.GLOBAL,
      persist = cacheOptions.persist,
      skipCache = cacheOptions.skipCache,
      ...restOptions
    } = options || {}

    return {
      meta: {
        persist,
        cacheType,
        skipCache
      },
      ...cacheOptions,
      ...(restOptions || {})
    }
  }

  useQuery(queryKey, queryFn, options = {}) {
    if (!queryFn || typeof queryFn !== 'function') {
      throw new Error('Invalid query key or query function')
    }

    if (!queryKey || !Array.isArray(queryKey) || queryKey.length === 0) {
      throw new Error('Invalid query key. Expected array, received: ' + typeof queryKey)
    }

    const queryOptions = this.#getQueryOptions(options)

    return useQuery({
      queryKey,
      queryFn,
      ...queryOptions,
      onError: () => {
        return Promise.resolve(null)
      }
    })
  }

  useMutation(mutationFn, options = {}) {
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

  async usePrefetchQuery(queryKey, queryFn, options = {}) {
    const queryOptions = this.#getQueryOptions(options)
    await waitForPersistenceRestore()

    return await this.queryClient.prefetchQuery({
      queryKey: queryKey,
      queryFn,
      ...queryOptions,
      onError: () => {
        return Promise.resolve(null)
      }
    })
  }

  async useEnsureQueryData(queryKey, queryFn, options = {}) {
    const queryOptions = this.#getQueryOptions(options)

    await waitForPersistenceRestore()

    if (queryOptions.meta?.skipCache) {
      return await queryFn()
    }

    return await this.queryClient.ensureQueryData({
      queryKey,
      queryFn,
      revalidateIfStale: true,
      ...queryOptions,
      onError: () => {
        return Promise.resolve(null)
      }
    })
  }

  /**
   * Get an item from the query cache
   * @param {Object} config - Configuration object
   * @param {string} config.cacheKey - The first element of the query key to match (e.g., 'workloads', 'marketplace')
   * @param {Function} config.findFn - Function to find the item in the cached list
   * @param {Function} [config.mapFn] - Optional function to transform the found item
   * @param {string} [config.listPath='body'] - Path to the list in the cached data (e.g., 'body' or '' for root)
   * @returns {Object|undefined} The found item or undefined
   */
  getFromCache({ cacheKey, findFn, mapFn, listPath = 'body' }) {
    if (!cacheKey || !findFn) return undefined

    const allQueries = this.queryClient.getQueryCache().getAll()

    for (const query of allQueries) {
      const key = query.queryKey
      if (!Array.isArray(key) || key[0] !== cacheKey) continue

      const cachedData = query.state?.data
      const listData = listPath ? cachedData?.[listPath] : cachedData

      if (!Array.isArray(listData)) continue

      const item = listData.find(findFn)

      if (item) {
        return mapFn ? mapFn(item) : item
      }
    }

    return undefined
  }
}
