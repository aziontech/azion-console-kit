import { QueryClient, useQuery } from '@tanstack/vue-query'
import { cacheManager } from './cache/CacheManager'
import { VersionManager } from './cache/VersionManager'
import { getCacheConfig } from './cache/CacheConfig'

class EnhancedQueryClient {
  constructor() {
    this.cacheManager = cacheManager
    this.versionManager = new VersionManager(this.cacheManager)
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
    await this.versionManager.initialize()
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
          staleTime: 5 * 60 * 1000, // 5 minutes
          gcTime: 10 * 60 * 1000, // 10 minutes
          retry: 2,
          refetchOnWindowFocus: false,
          refetchOnReconnect: true
        },
        mutations: {
          retry: 1
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
      // Silent fail
    }
  }

  _serializeQueryKey(queryKey) {
    if (!Array.isArray(queryKey)) {
      return String(queryKey)
    }
    
    return queryKey.map(item => {
      if (item === null || item === undefined) {
        return 'null'
      }
      if (typeof item === 'object') {
        try {
          const sortedKeys = Object.keys(item).sort()
          const sortedObj = {}
          sortedKeys.forEach(key => {
            sortedObj[key] = item[key]
          })
          return JSON.stringify(sortedObj)
        } catch (error) {
          return 'invalid_object'
        }
      }
      return String(item)
    }).join('_')
  }

  useQuery(options) {
    const { queryKey, queryFn, persistent, ...restOptions } = options

    const enhancedQueryFn = persistent ? async () => {
      const cachedData = await this._getCachedDataIfValid(queryKey)
      if (cachedData) {
        return cachedData
      }
      return queryFn()
    } : queryFn

    return useQuery({
      queryKey,
      queryFn: enhancedQueryFn,
      meta: { persistent },
      ...restOptions
    })
  }

  async _getCachedDataIfValid(queryKey) {
    try {
      await this.initialize()
      const cacheKey = this._serializeQueryKey(queryKey)
      return await this.cacheManager.get(cacheKey)
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