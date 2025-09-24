import { reactive } from 'vue'
import { cacheStore } from '@/services/v2/base/query/cacheStore'
import { DEFAULT_OPTIONS, CACHE_TYPE } from '@/services/v2/base/query/config'

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
    const cached = await cacheStore.get(queryKey, encrypted)

    if (cached && cached.data != null) {
      const isStale = Date.now() - cached.timestamp > staleTime
      this.#setupRefetch({ queryKey, queryFn, refetchInterval, gcTime, encrypted })
      if (!isStale) return cached.data
    }

    const fresh = await queryFn()
    await cacheStore.set(queryKey, { data: fresh, timestamp: Date.now(), gcTime }, encrypted)
    this.#setupRefetch({ queryKey, queryFn, refetchInterval, gcTime, encrypted })
    return fresh
  }

  async invalidate(queryKey) {
    await cacheStore.remove(queryKey)
    this.#clearRefetch(queryKey)
    this.#updateSubscribers(queryKey, (state) => {
      state.data = undefined
      state.isSuccess = false
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

  async #resolveQuery({ queryKey, queryFn, state, staleTime, gcTime, refetchInterval, encrypted }) {
    try {
      const cached = await cacheStore.get(queryKey, encrypted)

      if (cached && cached.data != null) {
        const isStale = Date.now() - cached.timestamp > staleTime
        this.#setSuccessState(state, cached.data)
        this.#setupRefetch({ queryKey, queryFn, refetchInterval, gcTime, encrypted })
        if (!isStale) return
      }

      const fresh = await queryFn()
      await cacheStore.set(queryKey, { data: fresh, timestamp: Date.now(), gcTime }, encrypted)
      this.#setSuccessState(state, fresh)
      this.#setupRefetch({ queryKey, queryFn, refetchInterval, gcTime, encrypted })
    } catch (err) {
      this.#setErrorState(state, err)
    }
  }

  #setupRefetch({ queryKey, queryFn, refetchInterval, gcTime, encrypted }) {
    if (!refetchInterval || refetchInterval <= 0) return
    if (this.timers.has(queryKey)) return

    const id = setInterval(async () => {
      if (document.hidden) return
      try {
        const fresh = await queryFn()
        await cacheStore.set(queryKey, { data: fresh, timestamp: Date.now(), gcTime }, encrypted)
        this.#updateSubscribers(queryKey, (state) => this.#setSuccessState(state, fresh))
      } catch (err) {
        this.#updateSubscribers(queryKey, (state) => this.#setErrorState(state, err))
      }
    }, refetchInterval)

    this.timers.set(queryKey, id)
  }

  #clearRefetch(queryKey) {
    const id = this.timers.get(queryKey)
    if (id) {
      clearInterval(id)
      this.timers.delete(queryKey)
    }
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
      .forEach((key) => this.subscribers.delete(key))
  }
}

export const queryClient = new QueryClient()
