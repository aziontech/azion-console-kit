import { SSEClient } from './sse-client'
import { BroadcastManager, TabCoordinator } from '../broadcast'
import { getKeysForEvents } from '../cache-sync/invalidation-map'
import { queryClient } from '../query/queryClient'

/**
 * FIXME: SSE endpoint URL will be changed in the future.
 * Current: /events/stream (proxied to stage-beholder.azion.net)
 * When the final endpoint is defined, update this constant and
 * the corresponding proxy configuration in vite.config.js.
 */
const SSE_ENDPOINT = '/events/stream'

/**
 * SSE Service - Singleton that manages SSE connection for the application
 *
 * Features:
 * - Single connection per session (singleton pattern)
 * - Only primary tab maintains connection (TabCoordinator)
 * - Automatic cache invalidation on activity events
 * - Integration with session lifecycle
 */
class SSEService {
  #client = null
  #broadcast = null
  #tabCoordinator = null
  #isInitialized = false
  #state = {
    isConnected: false,
    clientId: null
  }

  /**
   * Gets the current connection state
   * @returns {{ isConnected: boolean, clientId: string|null }}
   */
  get state() {
    return { ...this.#state }
  }

  /**
   * Checks if SSE is currently connected
   * @returns {boolean}
   */
  get isConnected() {
    return this.#state.isConnected
  }

  /**
   * Starts the SSE connection
   * Should be called after user authentication
   * @returns {void}
   */
  start() {
    if (this.#isInitialized) {
      return
    }

    this.#isInitialized = true

    // Setup broadcast channel for cross-tab coordination
    this.#broadcast = new BroadcastManager('sse-coordinator')
    this.#broadcast.start()

    // Setup tab coordinator - only primary tab connects to SSE
    this.#tabCoordinator = new TabCoordinator(this.#broadcast, {
      onBecomePrimary: () => {
        this.#connect()
      },
      onLosePrimary: () => {
        this.#disconnect()
      }
    })

    this.#tabCoordinator.start()
  }

  /**
   * Stops the SSE connection
   * Should be called on logout or account switch
   * @returns {void}
   */
  stop() {
    if (!this.#isInitialized) return

    this.#disconnect()
    this.#tabCoordinator?.stop()
    this.#broadcast?.close()

    this.#client = null
    this.#tabCoordinator = null
    this.#broadcast = null
    this.#isInitialized = false
  }

  /**
   * Connects to the SSE endpoint
   * @private
   */
  #connect() {
    if (this.#client) {
      return
    }

    this.#client = new SSEClient({
      url: SSE_ENDPOINT,
      withCredentials: true,
      reconnectMaxAttempts: 10,
      reconnectBaseDelay: 1000,
      reconnectMaxDelay: 30000
    })

    // Handle connected event
    this.#client.on('connected', (data) => {
      this.#state.isConnected = true
      this.#state.clientId = data.client_id

      // Broadcast connection state to other tabs
      this.#broadcast?.send('SSE_CONNECTED', { clientId: data.client_id })
    })

    // Handle activity events - invalidate relevant queries
    this.#client.on('activity', (event) => {
      this.#handleActivityEvent(event)
    })

    // Handle connection open
    this.#client.on('open', () => {
      this.#state.isConnected = true
    })

    // Handle connection close
    this.#client.on('close', () => {
      this.#state.isConnected = false
      this.#broadcast?.send('SSE_DISCONNECTED')
    })

    // Handle errors
    this.#client.on('error', () => {
      this.#state.isConnected = false
    })

    // Handle max reconnect attempts reached
    this.#client.on('maxReconnectAttempts', () => {
      this.#state.isConnected = false
    })

    this.#client.connect()
  }

  /**
   * Disconnects from the SSE endpoint
   * @private
   */
  #disconnect() {
    if (this.#client) {
      this.#client.disconnect()
      this.#client.destroy()
      this.#client = null
    }

    this.#state.isConnected = false
    this.#state.clientId = null
  }

  /**
   * Handles activity events by invalidating relevant query caches
   *
   * Event format:
   * {
   *   type: 'activity',
   *   data: {
   *     description: 'Dns Zone rodrigomaria.github.io was deleted',
   *     activity_type: 'deleted',
   *     resource: { type: 'unknown', name: '...', id: null },
   *     ...
   *   }
   * }
   *
   * @param {Object} event - Activity event from SSE
   * @param {Object} event.data - Activity data payload
   * @param {string} event.data.description - Human-readable description used for cache invalidation
   * @private
   */
  async #handleActivityEvent(event) {
    // Extract description from activity event data
    const description = event?.data?.description

    if (!description) {
      return
    }

    // Get query keys to invalidate based on event description
    const keysToInvalidate = getKeysForEvents([description])

    if (keysToInvalidate.length === 0) {
      return
    }

    // Invalidate queries
    for (const key of keysToInvalidate) {
      try {
        await queryClient.invalidateQueries({ queryKey: key })
      } catch {
        // Silently fail
      }
    }

    // Broadcast activity to other tabs
    this.#broadcast?.send('SSE_ACTIVITY', event.data)
  }

  /**
   * Subscribe to SSE events
   * @param {string} event - Event name
   * @param {Function} callback - Event handler
   * @returns {Function} Unsubscribe function
   */
  on(event, callback) {
    if (!this.#client) {
      return () => {}
    }
    return this.#client.on(event, callback)
  }

  /**
   * Unsubscribe from SSE events
   * @param {string} event - Event name
   * @param {Function} callback - Event handler to remove
   */
  off(event, callback) {
    this.#client?.off(event, callback)
  }
}

// Singleton instance
export const sseService = new SSEService()

export default sseService
