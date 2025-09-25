import { computed, reactive } from 'vue'

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
    fetchCount: 0
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

function register(queryKey, { refetchInterval } = {}) {
  const query = ensureQuery(queryKey)
  if (refetchInterval !== undefined) {
    query.refetchInterval = refetchInterval || null
    query.isAutoRefreshing = Boolean(query.refetchInterval)
  }
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
  query.status = 'success'
  query.isFetching = false
  query.error = null
  query.lastUpdatedAt = timestamp ?? query.lastUpdatedAt ?? Date.now()
  query.lastDuration = null
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
  query.lastUpdatedAt = completedAt
  query.lastDuration =
    query.lastFetchStartedAt != null ? completedAt - query.lastFetchStartedAt : null
  query.fetchCount = (query.fetchCount ?? 0) + 1
  query.isAutoRefreshing = Boolean(query.refetchInterval)
  query.nextAutoRefreshAt = query.isAutoRefreshing
    ? completedAt + query.refetchInterval
    : null
  query.lastFetchStartedAt = null
}

function resolveError(queryKey, error) {
  const query = getQueryState(queryKey)
  if (!query) return
  const completedAt = Date.now()
  query.status = 'error'
  query.isFetching = false
  query.error = normalizeError(error)
  query.lastUpdatedAt = completedAt
  query.lastDuration =
    query.lastFetchStartedAt != null ? completedAt - query.lastFetchStartedAt : null
  query.fetchCount = (query.fetchCount ?? 0) + 1
  if (query.refetchInterval) {
    query.nextAutoRefreshAt = completedAt + query.refetchInterval
  }
  query.lastFetchStartedAt = null
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

function invalidate(queryKey) {
  const query = getQueryState(queryKey)
  if (!query) return
  const preservedKey = query.queryKey
  queriesState[preservedKey] = {
    ...createDefaultState(preservedKey)
  }
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

export const queryDevtools = {
  register,
  start,
  resolveFromCache,
  resolveSuccess,
  resolveError,
  setAutoRefresh,
  scheduleNext,
  invalidate,
  unregister,
  reset,
  getQuery,
  queries
}
