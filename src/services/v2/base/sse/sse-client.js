/**
 * SSE Client - Wrapper for EventSource with automatic reconnection
 *
 * @typedef {Object} SSEClientOptions
 * @property {string} url - SSE endpoint URL
 * @property {boolean} [withCredentials=true] - Send session cookies
 * @property {number} [reconnectMaxAttempts=10] - Maximum reconnection attempts
 * @property {number} [reconnectBaseDelay=1000] - Initial delay in ms
 * @property {number} [reconnectMaxDelay=30000] - Maximum delay in ms
 */

/**
 * @typedef {Object} SSEClientState
 * @property {boolean} isConnected
 * @property {string|null} clientId
 * @property {number} reconnectAttempts
 * @property {Error|null} lastError
 */

/**
 * @typedef {Object} SSEConnectedEvent
 * @property {'connected'} type
 * @property {string} client_id
 * @property {string} timestamp
 */

/**
 * @typedef {Object} SSEActivityUser
 * @property {string} email
 * @property {string} name
 */

/**
 * @typedef {Object} SSEActivityResource
 * @property {string} type
 * @property {string} name
 * @property {string|null} id
 */

/**
 * @typedef {Object} SSEActivityData
 * @property {SSEActivityUser} user
 * @property {string} activity_type - "created", "deleted", "updated", etc.
 * @property {SSEActivityResource} resource
 * @property {string} timestamp
 * @property {string} description - Human-readable description of the activity
 * @property {Object} [metadata] - Additional metadata about the activity
 */

/**
 * @typedef {Object} SSEActivityEvent
 * @property {'activity'} type
 * @property {SSEActivityData} data
 */

/** @typedef {SSEConnectedEvent|SSEActivityEvent} SSEEvent */

const DEFAULT_OPTIONS = {
  withCredentials: true,
  reconnectMaxAttempts: 10,
  reconnectBaseDelay: 1000,
  reconnectMaxDelay: 30000,
  inactivityTimeout: 60000
}

export class SSEClient {
  #eventSource = null
  #options = null
  #state = {
    isConnected: false,
    clientId: null,
    reconnectAttempts: 0,
    lastError: null
  }
  #listeners = new Map()
  #reconnectTimeoutId = null
  #inactivityTimeoutId = null
  #isIntentionallyClosed = false

  /**
   * Creates a new SSE client instance
   * @param {SSEClientOptions} options - Client configuration
   */
  constructor(options) {
    this.#options = { ...DEFAULT_OPTIONS, ...options }

    if (!this.#options.url) {
      throw new Error('[SSE] URL is required')
    }
  }

  /**
   * Gets the current connection state
   * @returns {SSEClientState}
   */
  getState() {
    return { ...this.#state }
  }

  /**
   * Connects to the SSE endpoint
   * @returns {void}
   */
  connect() {
    this.#cleanupEventSource()
    this.#clearReconnectTimeout()
    this.#isIntentionallyClosed = false
    this.#createEventSource()
  }

  /**
   * Disconnects from the SSE endpoint
   * @returns {void}
   */
  disconnect() {
    this.#isIntentionallyClosed = true
    this.#cleanup()
  }

  /**
   * Subscribes to an event type
   * @param {string} event - Event name ('connected', 'activity', 'message', 'error')
   * @param {Function} callback - Event handler
   * @returns {Function} Unsubscribe function
   */
  on(event, callback) {
    if (!this.#listeners.has(event)) {
      this.#listeners.set(event, new Set())
    }
    this.#listeners.get(event).add(callback)

    return () => this.off(event, callback)
  }

  /**
   * Unsubscribes from an event type
   * @param {string} event - Event name
   * @param {Function} callback - Event handler to remove
   * @returns {void}
   */
  off(event, callback) {
    const eventListeners = this.#listeners.get(event)
    if (eventListeners) {
      eventListeners.delete(callback)
    }
  }

  #createEventSource() {
    this.#eventSource = new EventSource(this.#options.url, {
      withCredentials: this.#options.withCredentials
    })
    this.#setupEventHandlers()
  }

  #setupEventHandlers() {
    if (!this.#eventSource) return

    this.#eventSource.onopen = () => {
      this.#state.isConnected = true
      this.#state.reconnectAttempts = 0
      this.#state.lastError = null
      this.#resetInactivityTimeout()
      this.#emit('open', {})
    }

    this.#eventSource.onerror = () => {
      this.#clearInactivityTimeout()
      const error = new Error('SSE connection error')
      this.#handleError(error)
    }

    this.#eventSource.onmessage = (event) => {
      this.#resetInactivityTimeout()
      this.#handleMessage(event)
    }
  }

  /**
   * @param {MessageEvent} event
   */
  #handleMessage(event) {
    try {
      const data = JSON.parse(event.data)

      // Emit to 'message' listeners
      this.#emit('message', data)

      // Emit to specific event type listeners
      if (data.type) {
        this.#emit(data.type, data)
      }

      // Handle 'connected' event specifically
      if (data.type === 'connected') {
        this.#state.clientId = data.client_id
      }
    } catch {
      // parse errors are expected for non-JSON messages
    }
  }

  /**
   * @param {Error} error
   */
  #handleError(error) {
    this.#state.isConnected = false
    this.#state.lastError = error

    this.#emit('error', error)

    // Don't reconnect if intentionally closed
    if (this.#isIntentionallyClosed) {
      return
    }

    // Check if EventSource is in CLOSED state (failed to connect)
    if (this.#eventSource?.readyState === EventSource.CLOSED) {
      this.#eventSource = null
      this.#attemptReconnect()
    } else {
      // Connection lost, will attempt to reconnect
      this.#cleanupEventSource()
      this.#attemptReconnect()
    }
  }

  #attemptReconnect() {
    const { reconnectMaxAttempts, reconnectBaseDelay, reconnectMaxDelay } = this.#options

    if (this.#state.reconnectAttempts >= reconnectMaxAttempts) {
      this.#emit('maxReconnectAttempts', { attempts: this.#state.reconnectAttempts })
      return
    }

    // Exponential backoff: delay = min(maxDelay, baseDelay * 2^attempts)
    const delay = Math.min(
      reconnectMaxDelay,
      reconnectBaseDelay * Math.pow(2, this.#state.reconnectAttempts)
    )

    this.#state.reconnectAttempts++

    this.#reconnectTimeoutId = setTimeout(() => {
      if (!this.#isIntentionallyClosed) {
        this.#createEventSource()
      }
    }, delay)
  }

  #emit(event, data) {
    const eventListeners = this.#listeners.get(event)
    if (eventListeners) {
      eventListeners.forEach((callback) => {
        try {
          callback(data)
        } catch {
          // prevent listener errors from breaking other listeners
        }
      })
    }
  }

  #resetInactivityTimeout() {
    this.#clearInactivityTimeout()
    this.#inactivityTimeoutId = setTimeout(() => {
      if (this.#state.isConnected && !this.#isIntentionallyClosed) {
        this.#handleError(new Error('SSE inactivity timeout'))
      }
    }, this.#options.inactivityTimeout)
  }

  #clearInactivityTimeout() {
    if (this.#inactivityTimeoutId) {
      clearTimeout(this.#inactivityTimeoutId)
      this.#inactivityTimeoutId = null
    }
  }

  #cleanupEventSource() {
    if (this.#eventSource) {
      this.#eventSource.onopen = null
      this.#eventSource.onerror = null
      this.#eventSource.onmessage = null
      this.#eventSource.close()
      this.#eventSource = null
    }
  }

  #cleanup() {
    this.#clearReconnectTimeout()
    this.#clearInactivityTimeout()
    this.#cleanupEventSource()

    this.#state.isConnected = false
    this.#state.clientId = null

    this.#emit('close', {})
  }

  #clearReconnectTimeout() {
    if (this.#reconnectTimeoutId) {
      clearTimeout(this.#reconnectTimeoutId)
      this.#reconnectTimeoutId = null
    }
  }

  /**
   * Cleanup all resources
   */
  destroy() {
    this.disconnect()
    this.#listeners.clear()
  }
}
