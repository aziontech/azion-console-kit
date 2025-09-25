import { computed, reactive } from 'vue'

const rawFlag =
  typeof import.meta !== 'undefined' && import.meta.env
    ? import.meta.env.VITE_DEV_TOOLS
    : false

const isQueryDevtoolsEnabled =
  typeof rawFlag === 'string'
    ? rawFlag.toLowerCase() === 'true'
    : Boolean(rawFlag)

let queryDevtools

if (!isQueryDevtoolsEnabled) {
  const emptyQueries = computed(() => [])
  const noop = () => {}

  queryDevtools = {
    register: noop,
    start: noop,
    resolveFromCache: noop,
    resolveSuccess: noop,
    resolveError: noop,
    setAutoRefresh: noop,
    scheduleNext: noop,
    scheduleGarbageCollection: noop,
    clearGarbageCollection: noop,
    markGarbageCollected: noop,
    setObserverCount: noop,
    invalidate: noop,
    unregister: noop,
    reset: noop,
    getQuery: noop,
    queries: emptyQueries
  }
} else {
  const queriesState = reactive({})

  function createDefaultState(queryKey) {
    return {
      queryKey,
      status: 'idle',
      isFetching: false,
      refetchInterval: null,
      isAutoRefreshing: false,
      nextAutoRefreshAt: null,
      lastUpdatedAt: null,
      lastFetchStartedAt: null,
      lastDuration: null,
      error: null,
      fetchCount: 0,
      staleTime: null,
      staleAt: null,
      gcTime: null,
      gcExpiresAt: null,
      gcScheduledAt: null,
      garbageCollectedAt: null,
      observerCount: 0
    }
  }

  function ensureQuery(queryKey) {
    const key = String(queryKey)
    if (!queriesState[key]) {
      queriesState[key] = createDefaultState(key)
    }
    return queriesState[key]
  }

  function getQueryState(queryKey) {
    return queriesState[String(queryKey)]
  }

  function normalizeError(error) {
    if (error == null) return null
    if (error instanceof Error) {
      return {
        message: error.message,
        stack: error.stack
      }
    }
    if (typeof error === 'object') {
      try {
        return { message: JSON.stringify(error) }
      } catch {
        return { message: String(error) }
      }
    }
    return { message: String(error) }
  }

  function updateLifetimes(query, completedAt) {
    query.lastUpdatedAt = completedAt
    query.staleAt = query.staleTime ? completedAt + query.staleTime : null
    query.gcExpiresAt = query.gcTime ? completedAt + query.gcTime : null
  }

  function register(queryKey, { refetchInterval, staleTime, gcTime } = {}) {
    const query = ensureQuery(queryKey)
    if (refetchInterval !== undefined) {
      query.refetchInterval = refetchInterval || null
      query.isAutoRefreshing = Boolean(query.refetchInterval)
    }
    if (staleTime !== undefined) {
      query.staleTime = staleTime || null
    }
    if (gcTime !== undefined) {
      query.gcTime = gcTime || null
    }
    query.garbageCollectedAt = null
    return query
  }

  function start(queryKey, { isAutoRefresh = false } = {}) {
    const query = getQueryState(queryKey)
    if (!query) return
    query.status = 'loading'
    query.isFetching = true
    query.error = null
    query.lastFetchStartedAt = Date.now()
    if (isAutoRefresh && query.refetchInterval) {
      query.isAutoRefreshing = true
    }
  }

  function resolveFromCache(queryKey, timestamp) {
    const query = getQueryState(queryKey)
    if (!query) return
    const resolvedAt = timestamp ?? query.lastUpdatedAt ?? Date.now()
    query.status = 'success'
    query.isFetching = false
    query.error = null
    query.lastDuration = null
    updateLifetimes(query, resolvedAt)
    query.garbageCollectedAt = null
  }

  function resolveSuccess(queryKey, { refetchInterval } = {}) {
    const query = getQueryState(queryKey)
    if (!query) return
    if (refetchInterval !== undefined) {
      query.refetchInterval = refetchInterval || null
    }
    const completedAt = Date.now()
    query.status = 'success'
    query.isFetching = false
    query.error = null
    query.lastDuration =
      query.lastFetchStartedAt != null ? completedAt - query.lastFetchStartedAt : null
    query.fetchCount = (query.fetchCount ?? 0) + 1
    query.isAutoRefreshing = Boolean(query.refetchInterval)
    query.nextAutoRefreshAt = query.isAutoRefreshing
      ? completedAt + query.refetchInterval
      : null
    query.lastFetchStartedAt = null
    updateLifetimes(query, completedAt)
    query.garbageCollectedAt = null
  }

  function resolveError(queryKey, error) {
    const query = getQueryState(queryKey)
    if (!query) return
    const completedAt = Date.now()
    query.status = 'error'
    query.isFetching = false
    query.error = normalizeError(error)
    query.lastDuration =
      query.lastFetchStartedAt != null ? completedAt - query.lastFetchStartedAt : null
    query.fetchCount = (query.fetchCount ?? 0) + 1
    if (query.refetchInterval) {
      query.nextAutoRefreshAt = completedAt + query.refetchInterval
    }
    query.lastFetchStartedAt = null
    updateLifetimes(query, completedAt)
    query.garbageCollectedAt = null
  }

  function setAutoRefresh(queryKey, refetchInterval) {
    const query = getQueryState(queryKey)
    if (!query) return
    query.refetchInterval = refetchInterval || null
    query.isAutoRefreshing = Boolean(query.refetchInterval)
    if (!query.isAutoRefreshing) {
      query.nextAutoRefreshAt = null
    }
  }

  function scheduleNext(queryKey, refetchInterval) {
    const query = getQueryState(queryKey)
    if (!query) return
    const interval = refetchInterval ?? query.refetchInterval
    if (!interval) {
      query.nextAutoRefreshAt = null
      return
    }
    query.nextAutoRefreshAt = Date.now() + interval
  }

  function scheduleGarbageCollection(queryKey, gcTime) {
    const query = getQueryState(queryKey)
    if (!query) return
    if (!gcTime) {
      query.gcScheduledAt = null
      return
    }
    query.gcScheduledAt = Date.now() + gcTime
    query.garbageCollectedAt = null
  }

  function clearGarbageCollection(queryKey) {
    const query = getQueryState(queryKey)
    if (!query) return
    query.gcScheduledAt = null
  }

  function markGarbageCollected(queryKey) {
    const query = getQueryState(queryKey)
    if (!query) return
    query.status = 'idle'
    query.isFetching = false
    query.isAutoRefreshing = false
    query.refetchInterval = null
    query.nextAutoRefreshAt = null
    query.lastUpdatedAt = null
    query.lastDuration = null
    query.error = null
    query.gcExpiresAt = null
    query.staleAt = null
    query.gcScheduledAt = null
    query.garbageCollectedAt = Date.now()
    query.observerCount = 0
  }

  function setObserverCount(queryKey, count) {
    const query = getQueryState(queryKey)
    if (!query) return
    query.observerCount = count
  }

  function invalidate(queryKey) {
    const query = getQueryState(queryKey)
    if (!query) return
    const preserved = {
      refetchInterval: query.refetchInterval,
      staleTime: query.staleTime,
      gcTime: query.gcTime,
      observerCount: query.observerCount
    }
    const next = {
      ...createDefaultState(query.queryKey),
      ...preserved
    }
    if (next.refetchInterval) {
      next.isAutoRefreshing = true
    }
    queriesState[query.queryKey] = next
  }

  function unregister(queryKey) {
    const key = String(queryKey)
    if (queriesState[key]) {
      delete queriesState[key]
    }
  }

  function reset() {
    Object.keys(queriesState).forEach((key) => delete queriesState[key])
  }

  const queries = computed(() => Object.values(queriesState))

  function getQuery(queryKey) {
    return getQueryState(queryKey)
  }

  queryDevtools = {
    register,
    start,
    resolveFromCache,
    resolveSuccess,
    resolveError,
    setAutoRefresh,
    scheduleNext,
    scheduleGarbageCollection,
    clearGarbageCollection,
    markGarbageCollected,
    setObserverCount,
    invalidate,
    unregister,
    reset,
    getQuery,
    queries
  }
}

export { isQueryDevtoolsEnabled, queryDevtools }
