import { reactive } from 'vue'
import { cacheStore } from '@/services/v2/base/query/cacheStore'
import { DEFAULT_OPTIONS, CACHE_TYPE } from '@/services/v2/base/query/config'
import { queryDevtools } from '@/services/v2/base/query/queryDevtools'

const isDocumentHidden = () => Boolean(globalThis.document && globalThis.document.hidden)

export class QueryClient {
  constructor() {
    this.timers = new Map()
    this.subscribers = new Map()
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
