import { httpService } from './httpService'
import { useMutation } from '@tanstack/vue-query'
import { useAccountStore } from '@/stores/account'
import { enhancedQueryClient } from './queryClient'
import { CACHE_TYPES, getCacheConfig } from './cache/CacheConfig'

export class BaseService {
  constructor() {
    if (this.constructor.instance) {
      return this.constructor.instance
    }

    this.http = httpService
    this.queryClient = enhancedQueryClient
    this.constructor.instance = this
  }

  buildQueryKey(key, { isGlobal = false, isUser = true } = {}) {
    const keys = Array.isArray(key) ? key : [key]
    const keyCondition = []

    if (isGlobal) {
      keyCondition.push('global')
    }
    if (isUser) {
      const accountStore = useAccountStore()
      const { user_id: accountId } = accountStore.accountData
      const id = accountId || 'default'
      keyCondition.push(id)
    }

    return [...keyCondition, ...keys]
  }

  _buildPersistentConfig(persistent, isUser, isGlobal) {
    if (!persistent) return null

    let persistentConfig = null
    if (typeof persistent === 'string') {
      persistentConfig = {
        type: persistent,
        ...getCacheConfig(persistent)
      }
    } else {
      persistentConfig = persistent
    }

    if (isUser && !isGlobal) {
      const accountStore = useAccountStore()
      const { user_id: accountId } = accountStore.accountData
      persistentConfig.userScope = accountId || 'default'
    }

    return persistentConfig
  }

  useQuery(key, queryFn, options = {}) {
    const { persistent, isGlobal, isUser, ...restOptions } = options
    const queryKey = this.buildQueryKey(key, { isGlobal, isUser })
    const persistentConfig = this._buildPersistentConfig(persistent, isUser, isGlobal)

    return this.queryClient.useQuery({
      queryKey,
      queryFn,
      persistent: persistentConfig,
      ...restOptions
    })
  }

  async prefetchQuery(key, queryFn, options = {}) {
    const { persistent, isGlobal, isUser, ...restOptions } = options
    const queryKey = this.buildQueryKey(key, { isGlobal, isUser })
    const persistentConfig = this._buildPersistentConfig(persistent, isUser, isGlobal)

    const enhancedQueryFn = persistentConfig ? async () => {
      const cachedData = await this.queryClient._getCachedDataIfValid(queryKey)
      if (cachedData) {
        return cachedData
      }
      return queryFn()
    } : queryFn

    await this.queryClient.initialize()
    
    // Use fetchQuery instead of prefetchQuery to get the data back
    return this.queryClient.queryClient.fetchQuery({
      queryKey,
      queryFn: enhancedQueryFn,
      meta: { persistent: persistentConfig },
      ...restOptions
    })
  }

  useMutation(mutationFn, options = {}) {
    const { invalidateQueries, ...restOptions } = options

    return useMutation({
      mutationFn,
      onSuccess: (data, variables, context) => {
        if (invalidateQueries) {
          const patterns = Array.isArray(invalidateQueries) 
            ? invalidateQueries 
            : [invalidateQueries]
          
          patterns.forEach(pattern => {
            this.queryClient.invalidateQueries(pattern)
          })
        }

        if (restOptions.onSuccess) {
          restOptions.onSuccess(data, variables, context)
        }
      },
      ...restOptions
    })
  }

  useGlobalQuery(key, queryFn, options = {}) {
    return this.useQuery(key, queryFn, { 
      ...options, 
      persistent: CACHE_TYPES.GLOBAL_PERSISTENT,
      isGlobal: true, 
      isUser: false 
    })
  }

  useUserQuery(key, queryFn, options = {}) {
    return this.useQuery(key, queryFn, { 
      ...options, 
      persistent: CACHE_TYPES.USER_PERSISTENT,
      isUser: true,
      isGlobal: false
    })
  }

  async fetchUserQuery(key, queryFn, options = {}) {
    return this.prefetchQuery(key, queryFn, { 
      ...options, 
      persistent: CACHE_TYPES.USER_PERSISTENT,
      isUser: true,
      isGlobal: false
    })
  }

  async fetchGlobalQuery(key, queryFn, options = {}) {
    return this.prefetchQuery(key, queryFn, { 
      ...options, 
      persistent: CACHE_TYPES.GLOBAL_PERSISTENT,
      isGlobal: true,
      isUser: false
    })
  }

  invalidateQueries(pattern) {
    return this.queryClient.invalidateQueries(pattern)
  }

  async clearCache() {
    await this.queryClient.clearCache()
  }

  async useQueryWithCache(key, queryFn, options = {}) {
    const { persistent, isGlobal, isUser } = options
    const queryKey = this.buildQueryKey(key, { isGlobal, isUser })

    if (persistent) {
      await this.queryClient.preloadCache(queryKey)
    }

    return this.useQuery(key, queryFn, options)
  }

}