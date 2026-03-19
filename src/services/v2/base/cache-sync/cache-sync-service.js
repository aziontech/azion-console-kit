import { SSEClient } from '../sse/sse-client'
import { CacheInvalidator } from './cache-invalidator'
import { BroadcastManager, TabCoordinator } from '../broadcast'
import { queryClient } from '../query/queryClient'

const SSE_ENDPOINT = '/v4/sse'

/**
 * CacheSyncService - Orchestrates SSE connection and cache invalidation.
 *
 * Owns:
 * - ONE TabCoordinator (primary tab election)
 * - ONE BroadcastManager (cross-tab messaging for tab coordination)
 * - ONE SSEClient (EventSource connection, only on primary tab)
 * - ONE CacheInvalidator (converts activity events to query invalidations)
 *
 * Cross-tab query sync is handled by broadcastQueryClient (queryClient.js).
 */
class CacheSyncService {
  #client = null
  #broadcast = null
  #tabCoordinator = null
  #invalidator = new CacheInvalidator()
  #isInitialized = false
  #closedReconnectTimeoutId = null
  #state = {
    isConnected: false,
    clientId: null
  }

  get state() {
    return { ...this.#state }
  }

  get isConnected() {
    return this.#state.isConnected
  }

  start() {
    if (this.#isInitialized) return
    this.#isInitialized = true

    this.#broadcast = new BroadcastManager('cache-sync')
    this.#broadcast.start()

    // Listen for cache invalidation broadcasts from other tabs
    this.#broadcast.on('CACHE_INVALIDATION', ({ keys }) => {
      this.#handleRemoteInvalidation(keys)
    })

    this.#tabCoordinator = new TabCoordinator(this.#broadcast, {
      onBecomePrimary: () => this.#connectSSE(),
      onLosePrimary: () => this.#disconnectSSE()
    })

    this.#tabCoordinator.start()
  }

  stop() {
    if (!this.#isInitialized) return

    this.#clearClosedReconnectTimeout()
    this.#disconnectSSE()
    this.#tabCoordinator?.stop()
    this.#broadcast?.close()

    this.#tabCoordinator = null
    this.#broadcast = null
    this.#isInitialized = false
  }

  /**
   * @param {string} event
   * @param {Function} callback
   * @returns {Function} unsubscribe
   */
  on(event, callback) {
    if (!this.#client) return () => {}
    return this.#client.on(event, callback)
  }

  /**
   * @param {string} event
   * @param {Function} callback
   */
  off(event, callback) {
    this.#client?.off(event, callback)
  }

  /**
   * Handles cache invalidation broadcasts from other tabs.
   * @param {Array} keys - Array of query keys to invalidate
   */
  #handleRemoteInvalidation(keys) {
    if (!keys || keys.length === 0) return

    keys.forEach((key) => {
      queryClient.invalidateQueries({ queryKey: key })
    })
  }

  #connectSSE() {
    if (this.#client) return

    this.#client = new SSEClient({
      url: SSE_ENDPOINT,
      withCredentials: true
    })

    this.#client.on('open', () => {
      this.#state.isConnected = true
    })

    this.#client.on('connected', (data) => {
      this.#state.isConnected = true
      this.#state.clientId = data.client_id
    })

    this.#client.on('ping', () => {
      // Ping events keep the connection alive - no action needed
      // The SSEClient handles inactivity timeout internally
    })

    this.#client.on('activity', async (event) => {
      // Invalidate local cache and get the keys that were invalidated
      const invalidatedKeys = await this.#invalidator.invalidate(event)

      // Broadcast to other tabs (they will also invalidate)
      if (invalidatedKeys && invalidatedKeys.length > 0) {
        this.#broadcast.send('CACHE_INVALIDATION', { keys: invalidatedKeys })
      }
    })

    this.#client.on('close', () => {
      this.#state.isConnected = false
      this.#scheduleReconnect()
    })

    this.#client.on('error', () => {
      this.#state.isConnected = false
    })

    this.#client.on('maxReconnectAttempts', () => {
      this.#state.isConnected = false
    })

    this.#client.connect()
  }

  #disconnectSSE() {
    if (this.#client) {
      this.#client.destroy()
      this.#client = null
    }
    this.#state.isConnected = false
    this.#state.clientId = null
  }

  #scheduleReconnect() {
    this.#clearClosedReconnectTimeout()
    this.#closedReconnectTimeoutId = setTimeout(() => {
      this.#disconnectSSE()
      this.#connectSSE()
    }, 1000)
  }

  #clearClosedReconnectTimeout() {
    if (this.#closedReconnectTimeoutId) {
      clearTimeout(this.#closedReconnectTimeoutId)
      this.#closedReconnectTimeoutId = null
    }
  }
}

export const cacheSyncService = new CacheSyncService()

export function startCacheSync() {
  cacheSyncService.start()
}

export function resetCacheSync() {
  cacheSyncService.stop()
}
