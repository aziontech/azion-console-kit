import { QueryClient, useQuery } from '@tanstack/vue-query'
import { cacheManager } from './cache/CacheManager'
import { getCacheConfig } from './cache/CacheConfig'
import { TIME, RETRY } from './constants'

class EnhancedQueryClient {
  constructor() {
    this.cacheManager = cacheManager
    this.queryClient = this._createQueryClient()
    this.isInitialized = false
    this.initializationPromise = null
  }

  async initialize() {
    if (this.isInitialized) return

    if (this.initializationPromise) {
      return this.initializationPromise
    }

    this.initializationPromise = this._doInitialize()
    return this.initializationPromise
  }

  async _doInitialize() {
    await this.cacheManager.initialize()
    this._setupCacheSubscription()
    this.isInitialized = true
  }

  async initializeEarly() {
    await this.initialize()
    return this.isInitialized
  }

  _createQueryClient() {
    return new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: TIME.QUERY_STALE_5_MINUTES,
          gcTime: TIME.QUERY_GC_10_MINUTES,
          retry: RETRY.RETRY_2_TIMES,
          refetchOnWindowFocus: false,
          refetchOnReconnect: true
        },
        mutations: {
          retry: RETRY.RETRY_1_TIME
        }
      }
    })
  }

  _setupCacheSubscription() {
    this.queryClient.getQueryCache().subscribe((event) => {
      if (event.type === 'updated' && event.query.state.status === 'success') {
        this._handleQuerySuccess(event)
      }
    })
  }

  async _handleQuerySuccess(event) {
    const { queryKey, state, meta } = event.query

    if (!state.data || !meta?.persistent) return

    try {
      const cacheKey = this._serializeQueryKey(queryKey)
      const config = meta.persistent.type ? getCacheConfig(meta.persistent.type) : meta.persistent

      await this.cacheManager.set(cacheKey, state.data, {
        ttl: config.ttl,
        type: config.type,
        userScope: meta.persistent.userScope
      })
    } catch (error) {
      // Silent fail - cache is optional
    }
  }

  _serializeQueryKey(queryKey) {
    if (!Array.isArray(queryKey)) {
      return String(queryKey)
    }

    return queryKey
      .map((item) => {
        if (item === null || item === undefined) {
          return 'null'
        }
        if (typeof item === 'object') {
          try {
            const sortedKeys = Object.keys(item).sort()
            const sortedObj = {}
            sortedKeys.forEach((key) => {
              sortedObj[key] = item[key]
            })
            return JSON.stringify(sortedObj)
          } catch (error) {
            return 'invalid_object'
          }
        }
        return String(item)
      })
      .join('_')
  }

  useQuery(options) {
    const { queryKey, queryFn, persistent, ...restOptions } = options

    const enhancedQueryFn = persistent
      ? async () => {
          const cachedData = await this._getCachedDataIfValid(queryKey)
          if (cachedData) {
            return cachedData
          }
          // Se persistência expirou, executa queryFn para buscar dados frescos
          return queryFn()
        }
      : queryFn

    // Configurações específicas para queries persistentes
    const persistentOptions = persistent
      ? {
          staleTime: 0, // Dados sempre considerados stale para forçar verificação
          refetchOnMount: true, // Sempre verifica no mount
          refetchOnWindowFocus: true, // Verifica quando janela ganha foco
          refetchOnReconnect: true, // Verifica quando reconecta
          retry: RETRY.RETRY_3_TIMES // Mais tentativas para queries persistentes
        }
      : {}

    return useQuery({
      queryKey,
      queryFn: enhancedQueryFn,
      meta: { persistent },
      ...persistentOptions,
      ...restOptions
    })
  }

  async _getCachedDataIfValid(queryKey) {
    try {
      await this.initialize()
      const cacheKey = this._serializeQueryKey(queryKey)
      const data = await this.cacheManager.get(cacheKey)
      return data
    } catch (error) {
      return null
    }
  }

  invalidateQueries(...args) {
    return this.queryClient.invalidateQueries(...args)
  }

  setQueryData(...args) {
    return this.queryClient.setQueryData(...args)
  }

  getQueryData(...args) {
    return this.queryClient.getQueryData(...args)
  }

  async clearCache() {
    await this.cacheManager.clear()
  }

  async clearUserPersistentCache(userId) {
    await this.cacheManager.clear({ userScope: userId })
  }

  async preloadCache(queryKey) {
    await this.initialize()
    const existingData = this.queryClient.getQueryData(queryKey)
    if (!existingData) {
      const cachedData = await this._getCachedDataIfValid(queryKey)
      if (cachedData) {
        this.queryClient.setQueryData(queryKey, cachedData)
        return cachedData
      }
    }
    return existingData
  }
}

export const enhancedQueryClient = new EnhancedQueryClient()
export const queryClient = enhancedQueryClient.queryClient
