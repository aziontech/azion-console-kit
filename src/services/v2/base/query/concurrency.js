/**
 * Concurrency utilities for TanStack Query v5
 * Provides Mutex (mutations) and Request Coalescing (queries)
 */

// ============================================================================
// MUTEX - Serializes mutations to prevent race conditions
// ============================================================================

class Mutex {
  constructor() {
    this.queue = []
    this.locked = false
  }

  async run(operation) {
    while (this.locked) {
      await new Promise((resolve) => this.queue.push(resolve))
    }

    this.locked = true
    try {
      return await operation()
    } finally {
      this.locked = false
      const next = this.queue.shift()
      if (next) next()
    }
  }
}

const mutexRegistry = new Map()

export function getMutex(key) {
  if (!mutexRegistry.has(key)) {
    mutexRegistry.set(key, new Mutex())
  }
  return mutexRegistry.get(key)
}

// ============================================================================
// REQUEST COALESCING - Shares promises for identical GET queries
// ============================================================================

const pendingRequests = new Map()

function serializeQueryKey(queryKey) {
  try {
    return JSON.stringify(queryKey)
  } catch {
    return String(queryKey)
  }
}

export function coalesceRequest(queryKey, fetcher) {
  return async (params = {}) => {
    const key = serializeQueryKey(queryKey)

    if (pendingRequests.has(key)) {
      return pendingRequests.get(key)
    }

    const promise = fetcher(params)
      .then((result) => {
        pendingRequests.delete(key)
        return result
      })
      .catch((error) => {
        pendingRequests.delete(key)
        throw error
      })

    pendingRequests.set(key, promise)
    return promise
  }
}
