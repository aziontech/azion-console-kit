import { QueryClient, useQuery, useMutation } from '@tanstack/vue-query'
import { cacheManager } from './cache/CacheManager'
import { TIME, RETRY, CACHE_TYPE } from './constants'

const config = {
  cache: {
    ttl: TIME.CACHE_3_MINUTES,
    types: CACHE_TYPE
  },
  query: {
    defaultStaleTime: TIME.CACHE_5_MINUTES,
    refetchInterval: TIME.CACHE_1_MINUTE,
    defaultGcTime: TIME.CACHE_10_MINUTES
  },
  retry: {
    default: RETRY.RETRY_2_TIMES,
    mutation: RETRY.RETRY_1_TIME
  },
  refetch: {
    onMount: false,
    onWindowFocus: false,
    onReconnect: true
  }
}

const encrypt = (data) => {
  try {
    return btoa(JSON.stringify(data))
  } catch {
    return btoa(String(data))
  }
}

const decrypt = (encryptedData) => {
  try {
    return JSON.parse(atob(encryptedData))
  } catch {
    return atob(encryptedData)
  }
}

const serializeQueryKey = (queryKey) => {
  if (!Array.isArray(queryKey)) {
    return String(queryKey)
  }
  return queryKey
    .map((item) => {
      if (item === null || item === undefined) return 'null'
      if (typeof item === 'object') {
        try {
          return JSON.stringify(item)
        } catch {
          return 'invalid_object'
        }
      }
      return String(item)
    })
    .join('_')
}

class SimpleQueryClient {
  constructor() {
    this.queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: config.query.defaultStaleTime,
          gcTime: config.query.defaultGcTime,
          retry: config.retry.default,
          refetchInterval: config.query.refetchInterval,
          refetchOnWindowFocus: config.refetch.onWindowFocus,
          refetchOnReconnect: config.refetch.onReconnect
        },
        mutations: {
          retry: config.retry.mutation
        }
      }
    })

    this._setupCacheSubscription()
    this._initializeCache()
  }

  async _initializeCache() {
    try {
      await cacheManager.initialize()
    } catch (error) {
      return error
    }
  }

  _setupCacheSubscription() {
    this.queryClient.getQueryCache().subscribe((event) => {
      if (
        (event.type === 'updated' && event.query.state.status === 'success') ||
        (event.type === 'added' && event.query.state.status === 'success') ||
        (event.type === 'observerAdded' && event.query.state.status === 'success')
      ) {
        this._saveToCache(event.query)
      }
    })
  }

  async _saveToCache(query) {
    const { queryKey, state, meta } = query
    if (!state.data || !meta || (!meta.global && !meta.sensitive)) return

    try {
      const cacheKey = serializeQueryKey(queryKey)
      const dataToSave = meta.sensitive ? encrypt(state.data) : state.data
      await cacheManager.set(cacheKey, dataToSave, {
        ttl: config.cache.ttl,
        type: meta.global ? config.cache.types.GLOBAL : config.cache.types.SENSITIVE
      })
    } catch (error) {
      // Silent fail
    }
  }

  async _saveToCacheDirect(queryKey, data, global, sensitive) {
    if (!data || (!global && !sensitive)) return

    try {
      const cacheKey = serializeQueryKey(queryKey)
      const dataToSave = sensitive ? encrypt(data) : data
      await cacheManager.set(cacheKey, dataToSave, {
        ttl: config.cache.ttl,
        type: global ? config.cache.types.GLOBAL : config.cache.types.SENSITIVE
      })
    } catch (error) {
      // Silent fail
    }
  }

  async _getFromCache(queryKey, isSensitive = false) {
    try {
      const cacheKey = serializeQueryKey(queryKey)
      const data = await cacheManager.get(cacheKey)
      return isSensitive && data ? decrypt(data) : data
    } catch (error) {
      return null
    }
  }

  async _getInitialData(queryKey, global, sensitive) {
    const data = this._getFromCache(queryKey, sensitive)
    return global || sensitive ? data : undefined
  }

  _createCacheFirstQueryFn(queryKey, queryFn, global, sensitive) {
    return async () => {
      if (global || sensitive) {
        const cachedData = await this._getFromCache(queryKey, sensitive)
        if (cachedData) return cachedData
      }

      const result = await queryFn()
      if (result && (global || sensitive)) {
        await this._saveToCacheDirect(queryKey, result, global, sensitive)
      }
      return result
    }
  }

  useQuery(options) {
    const { queryKey, queryFn, global, sensitive, ...restOptions } = options
    const wrappedQueryFn = this._createCacheFirstQueryFn(queryKey, queryFn, global, sensitive)

    return useQuery({
      queryKey,
      queryFn: wrappedQueryFn,
      meta: { global, sensitive },
      ...restOptions
    })
  }

  async fetchQuery(options) {
    const { queryKey, queryFn, global, sensitive, ...restOptions } = options
    const initialData = await this._getInitialData(queryKey, global, sensitive)

    return await this.queryClient.fetchQuery({
      queryKey,
      queryFn,
      meta: { global, sensitive },
      initialData,
      ...restOptions
    })
  }

  invalidateQueries(...args) {
    return this.queryClient.invalidateQueries(...args)
  }

  useMutation(...args) {
    return useMutation(...args)
  }

  async clearCache() {
    await cacheManager.clear()
  }

  async clearSensitiveData() {
    await cacheManager.clear({ type: 'sensitive' })
    this.queryClient.invalidateQueries({
      predicate: (query) => query.meta?.sensitive === true
    })
  }
}

export const simpleQueryClient = new SimpleQueryClient()
export const queryClient = simpleQueryClient.queryClient
