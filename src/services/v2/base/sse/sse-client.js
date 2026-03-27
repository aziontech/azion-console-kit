/**
 * SSE Client - Wrapper for EventSource with automatic reconnection
 *
 * @typedef {Object} SSEClientOptions
 * @property {string} url - SSE endpoint URL
 * @property {boolean} [withCredentials=true] - Send session cookies
 * @property {number} [reconnectMaxAttempts=10] - Maximum reconnection attempts
 * @property {number} [reconnectBaseDelay=1000] - Initial delay in ms
 * @property {number} [reconnectMaxDelay=30000] - Maximum delay in ms
 * @property {number} [serverErrorMaxAttempts=3] - Max attempts for server errors
 * @property {number} [serverErrorMultiplier=2] - Backoff multiplier for server errors
 * @property {number} [connectionStabilityThreshold=5000] - Ms to consider connection stable
 */

/**
 * @typedef {Object} SSEClientState
 * @property {boolean} isConnected
 * @property {string|null} clientId
 * @property {number} reconnectAttempts
 * @property {Error|null} lastError
 * @property {number|null} connectionEstablishedAt - Timestamp when connection opened
 * @property {number} serverErrorAttempts - Consecutive server error attempts
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
  serverErrorMaxAttempts: 3,
  serverErrorMultiplier: 2,
  connectionStabilityThreshold: 5000
}

export class SSEClient {
  #eventSource = null
  #options = null
  #state = {
    isConnected: false,
    clientId: null,
    reconnectAttempts: 0,
    lastError: null,
    connectionEstablishedAt: null,
    serverErrorAttempts: 0
  }
  #listeners = new Map()
  #reconnectTimeoutId = null
  #isIntentionallyClosed = false
  #pingHandler = null

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
    this.#state.connectionEstablishedAt = null
    this.#cleanup()
  }

  /**
   * Resets server error state to allow manual reconnection attempts.
   * Call this after receiving 'server_unavailable' event if you want to retry.
   * @returns {void}
   */
  resetServerErrorState() {
    this.#state.serverErrorAttempts = 0
    this.#state.reconnectAttempts = 0
    this.#state.connectionEstablishedAt = null
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
      this.#state.serverErrorAttempts = 0
      this.#state.connectionEstablishedAt = Date.now()
      this.#state.lastError = null
      this.#emit('open', {})
    }

    this.#eventSource.onerror = () => {
      const error = new Error('SSE connection error')
      this.#handleError(error)
    }

    this.#eventSource.onmessage = (event) => {
      this.#handleMessage(event)
    }

    // Handle named SSE events (event: ping)
    this.#pingHandler = () => this.#emit('ping', { type: 'ping' })
    this.#eventSource.addEventListener('ping', this.#pingHandler)
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

    const classification = this.#classifyError()

    // Emitir erro genérico (mantém compatibilidade)
    this.#emit('error', error)

    if (this.#isIntentionallyClosed) return

    // Tratamento específico para erro de servidor
    if (classification.type === 'SERVER') {
      this.#handleServerError(error, classification)
      return
    }

    // Tratamento normal para erro de rede
    this.#handleNetworkError(error)
  }

  /**
   * Determina se o erro é de servidor baseado em heurística temporal.
   * Retorna true se:
   * 1. Conexão nunca chegou a abrir (connectionEstablishedAt === null)
   * 2. Conexão falhou < threshold ms após abrir (instável)
   */
  #isServerError() {
    const { connectionStabilityThreshold } = this.#options

    // Nunca conectou = provável erro de servidor (500)
    if (this.#state.connectionEstablishedAt === null) {
      return true
    }

    // Conectou mas falhou muito rápido = provável erro de servidor
    const stableTime = Date.now() - this.#state.connectionEstablishedAt
    return stableTime < connectionStabilityThreshold
  }

  /**
   * Classifica o tipo de erro para log e evento
   * @returns {{ type: string, retryable: boolean }}
   */
  #classifyError() {
    if (this.#isServerError()) {
      return {
        type: 'SERVER',
        retryable: this.#state.serverErrorAttempts < this.#options.serverErrorMaxAttempts
      }
    }
    return { type: 'NETWORK', retryable: true }
  }

  /**
   * @param {Error} error
   * @param {{ type: string, retryable: boolean }} classification
   */
  #handleServerError(error, classification) {
    this.#state.serverErrorAttempts++

    // Emitir evento específico
    this.#emit('server_error', {
      attempts: this.#state.serverErrorAttempts,
      maxAttempts: this.#options.serverErrorMaxAttempts,
      retryable: classification.retryable
    })

    // Verificar se excedeu tentativas de servidor
    if (this.#state.serverErrorAttempts >= this.#options.serverErrorMaxAttempts) {
      this.#emit('server_unavailable', {
        attempts: this.#state.serverErrorAttempts
      })
      return // PARA de tentar
    }

    // Backoff agressivo para servidor
    const delay = Math.min(
      this.#options.reconnectMaxDelay,
      this.#options.reconnectBaseDelay *
        Math.pow(this.#options.serverErrorMultiplier, this.#state.serverErrorAttempts)
    )

    this.#scheduleReconnect(delay)
  }

  /**
   * Handles network errors with normal exponential backoff.
   */
  #handleNetworkError() {
    this.#state.serverErrorAttempts = 0 // Reset contador de servidor

    // Verificar max tentativas normal
    if (this.#state.reconnectAttempts >= this.#options.reconnectMaxAttempts) {
      this.#emit('maxReconnectAttempts', { attempts: this.#state.reconnectAttempts })
      return
    }

    // Backoff normal (exponential)
    const delay = Math.min(
      this.#options.reconnectMaxDelay,
      this.#options.reconnectBaseDelay * Math.pow(2, this.#state.reconnectAttempts)
    )

    this.#state.reconnectAttempts++
    this.#scheduleReconnect(delay)
  }

  /**
   * @param {number} delay
   */
  #scheduleReconnect(delay) {
    // Check if EventSource is in CLOSED state (failed to connect)
    if (this.#eventSource?.readyState === EventSource.CLOSED) {
      this.#eventSource = null
    } else {
      this.#cleanupEventSource()
    }

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

  #cleanupEventSource() {
    if (this.#eventSource) {
      // Remove named event listeners
      if (this.#pingHandler) {
        this.#eventSource.removeEventListener('ping', this.#pingHandler)
      }
      // Clear standard handlers
      this.#eventSource.onopen = null
      this.#eventSource.onerror = null
      this.#eventSource.onmessage = null
      // Close connection
      this.#eventSource.close()
      this.#eventSource = null
    }
  }

  #cleanup() {
    this.#clearReconnectTimeout()
    this.#cleanupEventSource()

    this.#state.isConnected = false
    this.#state.clientId = null
    this.#state.connectionEstablishedAt = null

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
