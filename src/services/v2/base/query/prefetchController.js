/**
 * Prefetch Controller
 *
 * Integrated prefetch system that integrates with the base architecture.
 * Manages automatic prefetches, avoiding duplicate requests and waiting for
 * pending requests. Uses the existing coalescing system.
 */

import { queryClient } from './queryClient'
import { createQueryKey, getCacheOptions } from './queryClient'
import { coalesceRequest } from './concurrency'
import { CACHE_TYPE } from './config'
import { waitForPersistenceRestore } from './queryPlugin'

/**
 * State of a prefetch task
 */
class PrefetchTask {
  constructor(key, queryKey, queryFn, options = {}) {
    this.key = key
    this.queryKey = queryKey
    this.queryFn = queryFn
    this.options = options
    this.promise = null
    this.status = 'idle' // 'idle' | 'pending' | 'completed' | 'error'
    this.createdAt = Date.now()
  }

  /**
   * Executes the prefetch, reusing promise if already pending
   */
  async execute() {
    // If already pending, returns the existing promise
    if (this.status === 'pending' && this.promise) {
      return this.promise
    }

    // If already completed and cache is valid, no need to redo
    if (this.status === 'completed') {
      const cachedData = queryClient.getQueryData(this.queryKey)
      if (cachedData !== undefined) {
        const queryState = queryClient.getQueryState(this.queryKey)
        if (queryState && queryState.dataUpdatedAt) {
          const staleTime = this.options.staleTime || 0
          const isStale = Date.now() - queryState.dataUpdatedAt > staleTime
          if (!isStale) {
            return cachedData
          }
        }
      }
    }

    // Creates new promise with coalescing (uses existing system)
    this.status = 'pending'
    const coalescedFn = coalesceRequest(this.queryKey, this.queryFn)

    this.promise = queryClient
      .prefetchQuery({
        queryKey: this.queryKey,
        queryFn: coalescedFn,
        ...this.options
      })
      .then((result) => {
        this.status = 'completed'
        return result
      })
      .catch((error) => {
        this.status = 'error'
        throw error
      })
      .finally(() => {
        // Keeps the promise for a while for reuse
        setTimeout(() => {
          if (this.status === 'completed') {
            this.promise = null
          }
        }, 1000)
      })

    return this.promise
  }

  /**
   * Checks if the task is pending
   */
  isPending() {
    return this.status === 'pending'
  }

  /**
   * Waits for task completion if pending
   */
  async waitIfPending() {
    if (this.isPending() && this.promise) {
      return this.promise
    }
    return Promise.resolve()
  }
}

/**
 * Main prefetch controller
 * Integrated with base architecture
 */
class PrefetchController {
  constructor() {
    this.tasks = new Map()
    this.configs = new Map()
  }

  /**
   * Registers a prefetch configuration
   * @param {string} name - Unique configuration name
   * @param {Object} config - Prefetch configuration
   * @param {Function} config.queryFn - Function that returns { queryKey, queryFn }
   * @param {Array<string>} config.triggers - When to execute: ['login', 'access', 'manual']
   * @param {string} config.cache - Cache type (GLOBAL, SENSITIVE)
   * @param {Object} config.options - TanStack Query options
   */
  register(name, config) {
    if (this.configs.has(name)) {
      // Config already registered, overwriting
    }

    this.configs.set(name, {
      ...config,
      triggers: config.triggers || ['manual'],
      cache: config.cache || CACHE_TYPE.GLOBAL,
      options: config.options || {}
    })
  }

  /**
   * Executes a specific prefetch
   * @param {string} name - Configuration name
   * @param {Object} params - Parameters for queryFn
   * @returns {Promise} Query promise
   */
  async prefetch(name, params = {}) {
    const config = this.configs.get(name)
    if (!config) {
      // Config not found
      return Promise.resolve()
    }

    // Checks if prefetch is enabled
    if (config.options?.enabled !== undefined) {
      const enabled =
        typeof config.options.enabled === 'function'
          ? config.options.enabled(params)
          : config.options.enabled

      if (!enabled) {
        return Promise.resolve()
      }
    }

    // Generates a unique key based on name and parameters
    const taskKey = this._generateTaskKey(name, params)

    // If task already exists, reuses it
    if (this.tasks.has(taskKey)) {
      const task = this.tasks.get(taskKey)
      return task.execute()
    }

    // Waits for persistence restoration if necessary
    await waitForPersistenceRestore()

    // Creates new task
    const { queryKey: rawQueryKey, queryFn } = config.queryFn(params)
    const queryKey = createQueryKey(rawQueryKey, config.cache)
    const cacheOptions = getCacheOptions(config.cache)
    const finalOptions = { ...cacheOptions, ...config.options }

    const task = new PrefetchTask(taskKey, queryKey, queryFn, finalOptions)
    this.tasks.set(taskKey, task)

    return task.execute()
  }

  /**
   * Executes multiple prefetches in parallel
   * @param {Array<string>} names - Configuration names
   * @param {Object} params - Parameters for queryFns
   * @returns {Promise} Promise that resolves when all complete
   */
  async prefetchMany(names, params = {}) {
    const promises = names.map((name) => this.prefetch(name, params))
    return Promise.allSettled(promises)
  }

  /**
   * Executes all prefetches for a specific trigger
   * @param {string} trigger - 'login', 'access', etc.
   * @param {Object} params - Parameters for queryFns
   * @returns {Promise} Promise that resolves when all complete
   */
  async prefetchByTrigger(trigger, params = {}) {
    const configsToRun = []

    for (const [name, config] of this.configs.entries()) {
      if (config.triggers.includes(trigger)) {
        configsToRun.push(name)
      }
    }

    if (configsToRun.length === 0) {
      return Promise.resolve()
    }

    return this.prefetchMany(configsToRun, params)
  }

  /**
   * Waits for a specific prefetch if pending
   * @param {string} name - Configuration name
   * @param {Object} params - Parameters used in creation
   */
  async waitIfPending(name, params = {}) {
    const taskKey = this._generateTaskKey(name, params)
    const task = this.tasks.get(taskKey)

    if (task) {
      return task.waitIfPending()
    }

    return Promise.resolve()
  }

  /**
   * Checks if a prefetch is pending
   * @param {string} name - Configuration name
   * @param {Object} params - Parameters used in creation
   */
  isPending(name, params = {}) {
    const taskKey = this._generateTaskKey(name, params)
    const task = this.tasks.get(taskKey)
    return task ? task.isPending() : false
  }

  /**
   * Cleans up completed tasks (garbage collection)
   */
  cleanup() {
    const now = Date.now()
    const maxAge = 5 * 60 * 1000 // 5 minutes

    for (const [key, task] of this.tasks.entries()) {
      if (task.status === 'completed' && now - task.createdAt > maxAge) {
        this.tasks.delete(key)
      }
    }
  }

  /**
   * Clears all tasks
   */
  clear() {
    this.tasks.clear()
  }

  /**
   * Generates a unique key for the task
   */
  _generateTaskKey(name, params) {
    try {
      return `${name}:${JSON.stringify(params)}`
    } catch {
      return `${name}:${String(params)}`
    }
  }
}

// Singleton instance - following base architecture pattern
export const prefetchController = new PrefetchController()

// Periodic cleanup
if (typeof window !== 'undefined') {
  setInterval(() => {
    prefetchController.cleanup()
  }, 60000) // Every minute
}

export default prefetchController
