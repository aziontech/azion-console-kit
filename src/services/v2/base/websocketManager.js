export class WebSocketManager {
  constructor() {
    this.ws = null
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
    this.reconnectDelay = 1000
    this.listeners = new Map()
    this.isConnected = false
  }

  connect(url) {
    if (this.ws?.readyState === WebSocket.OPEN) return

    try {
      this.ws = new WebSocket(url)
      this._setupEventListeners()
    } catch (error) {
      // WebSocket connection failed
    }
  }

  _setupEventListeners() {
    this.ws.onopen = () => {
      this.isConnected = true
      this.reconnectAttempts = 0
    }

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        this._handleMessage(data)
      } catch (error) {
        // Invalid message format
      }
    }

    this.ws.onclose = () => {
      this.isConnected = false
      this._attemptReconnect()
    }

    this.ws.onerror = () => {
      // WebSocket error occurred
    }
  }

  _handleMessage(data) {
    const { type, payload } = data

    switch (type) {
      case 'query_invalidate':
        this._handleQueryInvalidation(payload)
        break
      case 'query_update':
        this._handleQueryUpdate(payload)
        break
      case 'cache_clear':
        this._handleCacheClear(payload)
        break
      default:
        // Unknown message type
    }
  }

  _handleQueryInvalidation(payload) {
    const { queryKey, reason } = payload
    this.emit('query_invalidate', { queryKey, reason })
  }

  _handleQueryUpdate(payload) {
    const { queryKey, data } = payload
    this.emit('query_update', { queryKey, data })
  }

  _handleCacheClear(payload) {
    const { criteria } = payload
    this.emit('cache_clear', { criteria })
  }

  _attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      return
    }

    this.reconnectAttempts++
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)
    
    setTimeout(() => {
      if (this.ws?.url) {
        this.connect(this.ws.url)
      }
    }, delay)
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event).add(callback)
  }

  off(event, callback) {
    const eventListeners = this.listeners.get(event)
    if (eventListeners) {
      eventListeners.delete(callback)
    }
  }

  emit(event, data) {
    const eventListeners = this.listeners.get(event)
    if (eventListeners) {
      eventListeners.forEach(callback => callback(data))
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.isConnected = false
  }
}

export const websocketManager = new WebSocketManager()
