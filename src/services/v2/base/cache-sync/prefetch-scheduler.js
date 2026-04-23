/**
 * PrefetchScheduler - Manages fixed-window timer for aggregated prefetch operations.
 *
 * Responsibilities:
 * - Aggregate queryKeys from multiple invalidation events
 * - Manage a single global aggregation timer (default 10s)
 * - Trigger PrefetchExecutor when timer fires
 * - Deduplicate queryKeys automatically via Set
 *
 * Design: Single global timer aggregates all events within a fixed time window.
 * This is preferred over per-queryKey timers because:
 * - Events typically arrive in bursts (e.g., during deployments)
 * - Simpler to manage and debug
 * - Natural grouping of related invalidations
 */

const DEFAULT_DEBOUNCE_MS = 10000

export class PrefetchScheduler {
  #pendingKeys = new Set()
  #timerId = null
  #executor = null
  #debounceMs = DEFAULT_DEBOUNCE_MS
  #isDestroyed = false
  #queryClient = null

  /**
   * @param {Object} options
   * @param {Object} options.executor - PrefetchExecutor instance
   * @param {number} [options.debounceMs=10000] - Debounce window in milliseconds
   * @param {Object} [options.queryClient] - TanStack QueryClient instance
   */
  constructor({ executor, debounceMs = DEFAULT_DEBOUNCE_MS, queryClient: qc = null }) {
    this.#executor = executor
    this.#debounceMs = debounceMs
    this.#queryClient = qc
  }

  /**
   * Schedules queryKeys for prefetch after aggregation window.
   * Adds keys to pending set and starts timer only on first event.
   *
   * @param {Array} queryKeys - Array of query keys to prefetch
   */
  schedule(queryKeys) {
    if (this.#isDestroyed) {
      return
    }

    if (!queryKeys || queryKeys.length === 0) return

    // Add keys to pending set (Set handles deduplication)
    queryKeys.forEach((key) => {
      this.#pendingKeys.add(this.#keyToString(key))
    })

    // Start timer only on first schedule call in the current window.
    // Subsequent events are aggregated without extending the window.
    if (this.#timerId === null) {
      this.#timerId = setTimeout(() => this.#onTimerFire(), this.#debounceMs)
    }
  }

  /**
   * Forces immediate execution of pending prefetches.
   * Useful for tests, shutdown, or manual flush.
   */
  flush() {
    if (this.#timerId !== null) {
      clearTimeout(this.#timerId)
      this.#timerId = null
    }
    this.#onTimerFire()
  }

  /**
   * Returns the number of pending query keys.
   * Useful for testing and debugging.
   *
   * @returns {number}
   */
  get pendingCount() {
    return this.#pendingKeys.size
  }

  /**
   * Returns whether the scheduler is currently waiting for timer.
   * Useful for testing and debugging.
   *
   * @returns {boolean}
   */
  get isTimerActive() {
    return this.#timerId !== null
  }

  /**
   * Cleans up resources and prevents further scheduling.
   * Safe to call multiple times.
   */
  destroy() {
    if (this.#isDestroyed) return

    if (this.#timerId !== null) {
      clearTimeout(this.#timerId)
      this.#timerId = null
    }

    this.#pendingKeys.clear()
    this.#isDestroyed = true
  }

  /**
   * Handles timer firing - executes prefetch for pending keys.
   * @private
   */
  #onTimerFire() {
    // Snapshot the pending keys to process
    const keysToProcess = [...this.#pendingKeys]
    this.#pendingKeys.clear()
    this.#timerId = null

    if (keysToProcess.length === 0) return

    // Convert string keys back to arrays for executor
    const queryKeys = keysToProcess.map((key) => this.#stringToKey(key))

    // Remove queries from IndexedDB before prefetching
    // if (this.#queryClient) {
    //   queryKeys.forEach((queryKey) => {
    //     this.#queryClient.removeQueries({ queryKey })
    //   })
    // }

    // Delegate to executor (async, fire-and-forget)
    this.#executor.execute(queryKeys).catch(() => {})
  }

  /**
   * Converts a queryKey array to a string for Set storage.
   * @param {Array} key
   * @returns {string}
   * @private
   */
  #keyToString(key) {
    return JSON.stringify(key)
  }

  /**
   * Converts a string back to queryKey array.
   * @param {string} str
   * @returns {Array}
   * @private
   */
  #stringToKey(str) {
    return JSON.parse(str)
  }
}
