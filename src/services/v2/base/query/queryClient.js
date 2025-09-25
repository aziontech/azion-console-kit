import { reactive } from 'vue'
import { cacheStore } from '@/services/v2/base/query/cacheStore'
import { DEFAULT_OPTIONS, CACHE_TYPE } from '@/services/v2/base/query/config'
import { queryDevtools } from '@/services/v2/base/query/queryDevtools'

const isDocumentHidden = () => Boolean(globalThis.document && globalThis.document.hidden)

export class QueryClient {
  constructor() {
    this.timers = new Map()
    this.subscribers = new Map()
    this.queryConfigs = new Map()
  }

  query({
    queryKey,
    queryFn,
    staleTime = DEFAULT_OPTIONS.staleTime,
    gcTime = DEFAULT_OPTIONS.gcTime,
    refetchInterval = DEFAULT_OPTIONS.refetchInterval,
    encrypted = false
  }) {
    const state = this.#createReactiveState()
    queryDevtools.register(queryKey, { refetchInterval })
    this.#storeConfig(queryKey, { queryFn, staleTime, gcTime, refetchInterval, encrypted })
    this.#registerSubscriber(queryKey, state)
    this.#resolveQuery({ queryKey, queryFn, state, staleTime, gcTime, refetchInterval, encrypted })
    return state
  }

  async queryAsync({
    queryKey,
    queryFn,
    staleTime = DEFAULT_OPTIONS.staleTime,
    gcTime = DEFAULT_OPTIONS.gcTime,
    refetchInterval = DEFAULT_OPTIONS.refetchInterval,
    encrypted = false
  }) {
    queryDevtools.register(queryKey, { refetchInterval })
    this.#storeConfig(queryKey, { queryFn, staleTime, gcTime, refetchInterval, encrypted })
    const cached = await cacheStore.get(queryKey, encrypted)

    if (cached && cached.data != null) {
      const isStale = Date.now() - cached.timestamp > staleTime
      this.#setupRefetch({ queryKey, queryFn, refetchInterval, gcTime, encrypted })
      queryDevtools.resolveFromCache(queryKey, cached.timestamp)
      if (!isStale) return cached.data
    }

    queryDevtools.start(queryKey)
    const fresh = await queryFn()
    await cacheStore.set(queryKey, { data: fresh, timestamp: Date.now(), gcTime }, encrypted)
    this.#setupRefetch({ queryKey, queryFn, refetchInterval, gcTime, encrypted })
    queryDevtools.resolveSuccess(queryKey, { refetchInterval })
    return fresh
  }

  async invalidate(queryKey) {
    await cacheStore.remove(queryKey)
    this.#clearRefetch(queryKey)
    this.#updateSubscribers(queryKey, (state) => {
      state.data = undefined
      state.isSuccess = false
    })
    queryDevtools.invalidate(queryKey)
  }

  async refetch(queryKey) {
    const config = this.queryConfigs.get(queryKey)
    if (!config?.queryFn) return undefined

    const { queryFn, gcTime, encrypted, refetchInterval } = config

    queryDevtools.start(queryKey)

    try {
      const fresh = await queryFn()
      await cacheStore.set(
        queryKey,
        { data: fresh, timestamp: Date.now(), gcTime },
        encrypted
      )
      this.#updateSubscribers(queryKey, (state) => this.#setSuccessState(state, fresh))
      queryDevtools.resolveSuccess(queryKey, { refetchInterval })
      return fresh
    } catch (err) {
      this.#updateSubscribers(queryKey, (state) => this.#setErrorState(state, err))
      queryDevtools.resolveError(queryKey, err)
      throw err
    }
  }

  async setAutoRefresh(queryKey, refetchInterval) {
    const config = this.queryConfigs.get(queryKey)
    if (!config) return

    this.#clearRefetch(queryKey)

    if (!refetchInterval || refetchInterval <= 0) {
      this.#updateConfig(queryKey, { refetchInterval: null })
      return
    }

    this.#updateConfig(queryKey, { refetchInterval })
    this.#setupRefetch({
      queryKey,
      queryFn: config.queryFn,
      refetchInterval,
      gcTime: config.gcTime,
      encrypted: config.encrypted
    })
  }

  async clearSensitive() {
    await this.#clearScope(CACHE_TYPE.SENSITIVE)
  }

  async clearGlobal() {
    await this.#clearScope(CACHE_TYPE.GLOBAL)
  }

  async clearAll() {
    await this.#clearScope(CACHE_TYPE.SENSITIVE)
    await this.#clearScope(CACHE_TYPE.GLOBAL)
  }

  async unregister(queryKey, state) {
    const set = this.subscribers.get(queryKey)
    if (!set) return
    set.delete(state)
    if (set.size === 0) {
      this.subscribers.delete(queryKey)
      this.#clearRefetch(queryKey)
      queryDevtools.unregister(queryKey)
      this.queryConfigs.delete(queryKey)
    }
  }

  async #resolveQuery({ queryKey, queryFn, state, staleTime, gcTime, refetchInterval, encrypted }) {
    try {
      const cached = await cacheStore.get(queryKey, encrypted)

      if (cached && cached.data != null) {
        const isStale = Date.now() - cached.timestamp > staleTime
        this.#setSuccessState(state, cached.data)
        this.#setupRefetch({ queryKey, queryFn, refetchInterval, gcTime, encrypted })
        queryDevtools.resolveFromCache(queryKey, cached.timestamp)
        if (!isStale) return
      }

      queryDevtools.start(queryKey)
      const fresh = await queryFn()
      await cacheStore.set(queryKey, { data: fresh, timestamp: Date.now(), gcTime }, encrypted)
      this.#setSuccessState(state, fresh)
      this.#setupRefetch({ queryKey, queryFn, refetchInterval, gcTime, encrypted })
      queryDevtools.resolveSuccess(queryKey, { refetchInterval })
      this.#updateConfig(queryKey, { queryFn, staleTime, gcTime, refetchInterval, encrypted })
    } catch (err) {
      this.#setErrorState(state, err)
      queryDevtools.resolveError(queryKey, err)
    }
  }

  #setupRefetch({ queryKey, queryFn, refetchInterval, gcTime, encrypted }) {
    if (!refetchInterval || refetchInterval <= 0) {
      queryDevtools.setAutoRefresh(queryKey, null)
      return
    }

    const hasTimer = this.timers.has(queryKey)
    queryDevtools.setAutoRefresh(queryKey, refetchInterval)
    if (!hasTimer) {
      queryDevtools.scheduleNext(queryKey, refetchInterval)
    }

    if (hasTimer) return

    const id = setInterval(async () => {
      if (isDocumentHidden()) {
        queryDevtools.scheduleNext(queryKey, refetchInterval)
        return
      }
      queryDevtools.start(queryKey, { isAutoRefresh: true })
      try {
        const fresh = await queryFn()
        await cacheStore.set(queryKey, { data: fresh, timestamp: Date.now(), gcTime }, encrypted)
        this.#updateSubscribers(queryKey, (state) => this.#setSuccessState(state, fresh))
        queryDevtools.resolveSuccess(queryKey)
      } catch (err) {
        this.#updateSubscribers(queryKey, (state) => this.#setErrorState(state, err))
        queryDevtools.resolveError(queryKey, err)
      }
      queryDevtools.scheduleNext(queryKey, refetchInterval)
    }, refetchInterval)

    this.timers.set(queryKey, id)
  }

  #clearRefetch(queryKey) {
    const id = this.timers.get(queryKey)
    if (id) {
      clearInterval(id)
      this.timers.delete(queryKey)
    }
    queryDevtools.setAutoRefresh(queryKey, null)
    this.#updateConfig(queryKey, { refetchInterval: null })
  }

  #registerSubscriber(queryKey, state) {
    if (!this.subscribers.has(queryKey)) this.subscribers.set(queryKey, new Set())
    this.subscribers.get(queryKey).add(state)
  }

  #updateSubscribers(queryKey, mutate) {
    const set = this.subscribers.get(queryKey)
    if (!set) return
    set.forEach(mutate)
  }

  #createReactiveState() {
    return reactive({
      data: undefined,
      error: null,
      isLoading: true,
      isError: false,
      isSuccess: false
    })
  }

  #storeConfig(queryKey, config) {
    const existing = this.queryConfigs.get(queryKey)
    this.queryConfigs.set(queryKey, {
      ...(existing ?? {}),
      ...config
    })
  }

  #updateConfig(queryKey, config) {
    if (!this.queryConfigs.has(queryKey)) return
    Object.assign(this.queryConfigs.get(queryKey), config)
  }

  #setSuccessState(state, data) {
    state.data = data
    state.isLoading = false
    state.isError = false
    state.isSuccess = true
    state.error = null
  }

  #setErrorState(state, err) {
    state.error = err
    state.isLoading = false
    state.isError = true
    state.isSuccess = false
  }

  async #clearScope(prefix) {
    await cacheStore.clearAllByPrefix(prefix)

    Array.from(this.timers.keys())
      .filter((key) => String(key).startsWith(prefix))
      .forEach((key) => this.#clearRefetch(key))

    Array.from(this.subscribers.keys())
      .filter((key) => String(key).startsWith(prefix))
      .forEach((key) => {
        this.subscribers.delete(key)
        queryDevtools.unregister(key)
      })
  }
}

export const queryClient = new QueryClient()
