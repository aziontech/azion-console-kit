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

export function coalesceRequest(endpoint, fetcher) {
  return async (params = {}) => {
    // Usa apenas o endpoint (queryKey serializada) como chave
    // Todos os parâmetros relevantes já estão na queryKey
    if (pendingRequests.has(endpoint)) {
      return pendingRequests.get(endpoint)
    }

    const promise = fetcher(params)
      .then((result) => {
        pendingRequests.delete(endpoint)
        return result
      })
      .catch((error) => {
        pendingRequests.delete(endpoint)
        throw error
      })

    pendingRequests.set(endpoint, promise)
    return promise
  }
}
