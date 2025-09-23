import { QueryClient, useMutation } from '@tanstack/vue-query'
import { cacheManager } from './cache/CacheManager'
import { TIME, RETRY } from './constants'

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
          staleTime: TIME.CACHE_5_MINUTES,
          gcTime: TIME.CACHE_10_MINUTES,
          retry: RETRY.RETRY_2_TIMES,
          refetchOnWindowFocus: false,
          refetchOnReconnect: true
        },
        mutations: {
          retry: RETRY.RETRY_1_TIME
        }
      }
    })

    this._setupCacheSubscription()
  }

  _setupCacheSubscription() {
    this.queryClient.getQueryCache().subscribe((event) => {
      if (event.type === 'updated' && event.query.state.status === 'success') {
        this._saveToCache(event.query)
      }
    })
  }

  async _saveToCache(query) {
    const { queryKey, state, meta } = query
    if (!state.data || !meta) return

    try {
      const cacheKey = serializeQueryKey(queryKey)

      if (meta.global) {
        await cacheManager.set(cacheKey, state.data, {
          ttl: TIME.CACHE_30_MINUTES,
          type: 'global'
        })
      }

      if (meta.sensitive) {
        const encryptedData = encrypt(state.data)
        await cacheManager.set(cacheKey, encryptedData, {
          ttl: TIME.CACHE_30_MINUTES,
          type: 'sensitive'
        })
      }
    } catch (error) {
      // Silent fail - cache é opcional
    }
  }

  async _getFromCache(queryKey, isSensitive = false) {
    try {
      const cacheKey = serializeQueryKey(queryKey)
      const data = await cacheManager.get(cacheKey)

      if (data && isSensitive) {
        return decrypt(data)
      }

      return data
    } catch (error) {
      return null
    }
  }

  async _getInitialData(queryKey, global, sensitive) {
    if (global || sensitive) {
      return await this._getFromCache(queryKey, sensitive)
    }
  }

  useQuery(options) {
    const { queryKey, queryFn, global, sensitive, ...restOptions } = options
    

    return this.queryClient.useQuery({
      queryKey,
      queryFn,
      meta: { global, sensitive },
      initialData: () => this._getInitialData(queryKey, global, sensitive),
      ...restOptions
    })
  }

  async fetchQuery(options) {
    const { queryKey, queryFn, global, sensitive, ...restOptions } = options
    const initialData = await this._getInitialData(queryKey, global, sensitive)
    return await this.queryClient.prefetchQuery({
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
