/**
 * SSE Client - Fetch-based SSE client with automatic reconnection
 *
 * Uses fetch + ReadableStream instead of EventSource to support custom headers.
 * This allows sending cookies from localhost to external domains.
 *
 * @typedef {Object} SSEClientOptions
 * @property {string} url - SSE endpoint URL
 * @property {boolean} [withCredentials=true] - Send credentials (cookies) in CORS requests
 * @property {Object} [headers={}] - Custom headers to send with the request
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
  headers: {},
  reconnectMaxAttempts: 10,
  reconnectBaseDelay: 1000,
  reconnectMaxDelay: 30000
}

export class SSEClient {
  #abortController = null
  #reader = null
  #options = null
  #state = {
    isConnected: false,
    clientId: null,
    reconnectAttempts: 0,
    lastError: null
  }
  #listeners = new Map()
  #reconnectTimeoutId = null
  #isIntentionallyClosed = false
  #buffer = ''

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
    this.#cleanup()
    this.#clearReconnectTimeout()
    this.#isIntentionallyClosed = false
    this.#buffer = ''
    this.#createConnection()
  }

  /**
   * Disconnects from the SSE endpoint
   * @returns {void}
   */
  disconnect() {
    this.#isIntentionallyClosed = true
    this.#cleanup()
    this.#state.isConnected = false
    this.#state.clientId = null
    this.#emit('close', {})
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

  async #createConnection() {
    this.#abortController = new AbortController()

    try {
      const response = await fetch(this.#options.url, {
        method: 'GET',
        headers: {
          Accept: 'text/event-stream',
          'Cache-Control': 'no-cache',
          ...this.#options.headers
        },
        credentials: this.#options.withCredentials ? 'include' : 'same-origin',
        mode: 'cors',
        signal: this.#abortController.signal
      })

      if (!response.ok) {
        throw new Error(`SSE connection failed: ${response.status} ${response.statusText}`)
      }

      this.#state.isConnected = true
      this.#state.reconnectAttempts = 0
      this.#state.lastError = null
      this.#emit('open', {})

      this.#reader = response.body.getReader()
      await this.#readStream()
    } catch (error) {
      if (error.name === 'AbortError') {
        // Intentionally cancelled, don't treat as error
        return
      }
      this.#handleError(error)
    }
  }

  async #readStream() {
    const decoder = new TextDecoder()

    try {
      while (!this.#isIntentionallyClosed) {
        const { done, value } = await this.#reader.read()

        if (done) {
          // Stream ended normally
          if (!this.#isIntentionallyClosed) {
            this.#handleError(new Error('SSE stream ended unexpectedly'))
          }
          return
        }

        this.#buffer += decoder.decode(value, { stream: true })
        this.#processBuffer()
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        return
      }
      this.#handleError(error)
    }
  }

  #processBuffer() {
    // SSE messages are separated by double newlines
    const messages = this.#buffer.split('\n\n')

    // Keep the last incomplete message in the buffer
    this.#buffer = messages.pop() || ''

    for (const message of messages) {
      if (message.trim()) {
        this.#processMessage(message)
      }
    }
  }

  #processMessage(message) {
    const lines = message.split('\n')
    let eventType = 'message'
    let data = ''

    for (const line of lines) {
      if (line.startsWith('event:')) {
        eventType = line.slice(6).trim()
      } else if (line.startsWith('data:')) {
        data += line.slice(5)
      }
    }

    // Handle named events like 'ping'
    if (eventType === 'ping') {
      this.#emit('ping', { type: 'ping' })
      return
    }

    // Parse JSON data for default events
    if (data) {
      try {
        const parsedData = JSON.parse(data)

        // Emit to 'message' listeners
        this.#emit('message', parsedData)

        // Emit to specific event type listeners
        if (parsedData.type) {
          this.#emit(parsedData.type, parsedData)
        }

        // Handle 'connected' event specifically
        if (parsedData.type === 'connected') {
          this.#state.clientId = parsedData.client_id
        }
      } catch {
        // Non-JSON data, emit as raw
        this.#emit('message', { raw: data })
      }
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

    this.#cleanup()
    this.#attemptReconnect()
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
        this.#createConnection()
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

  #cleanup() {
    if (this.#reader) {
      this.#reader.cancel().catch(() => {})
      this.#reader = null
    }

    if (this.#abortController) {
      this.#abortController.abort()
      this.#abortController = null
    }

    this.#buffer = ''
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
