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
        cacheManager.saveToCache(event.query)
      }
    })
  }

  useQuery(options) {
    const { queryKey, queryFn, global, sensitive, ...restOptions } = options
    const wrappedQueryFn = cacheManager.createCacheFirstQueryFn(
      queryKey,
      queryFn,
      global,
      sensitive
    )

    return useQuery({
      queryKey,
      queryFn: wrappedQueryFn,
      meta: { global, sensitive },
      ...restOptions
    })
  }

  async fetchQuery(options) {
    const { queryKey, queryFn, global, sensitive, ...restOptions } = options
    const initialData = await cacheManager.getInitialData(queryKey, global, sensitive)

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
    await cacheManager.clearSensitiveData()
    this.queryClient.invalidateQueries({
      predicate: (query) => query.meta?.sensitive === true
    })
  }
}

export const simpleQueryClient = new SimpleQueryClient()
export const queryClient = simpleQueryClient.queryClient
