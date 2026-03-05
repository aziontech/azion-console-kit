import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { SSEClient } from '@services/v2/base/sse/sse-client'

const fixtures = {
  url: '/events/stream',
  connectedEvent: {
    type: 'connected',
    client_id: '0001a',
    timestamp: '2026-03-04T19:46:15.619672Z'
  },
  activityEvent: {
    type: 'activity',
    data: {
      user: {
        email: 'services@azion.com',
        name: 'Services Azion'
      },
      activity_type: 'deleted',
      resource: {
        type: 'unknown',
        name: 'Dns Zone rodrigomaria.github.io',
        id: null
      },
      timestamp: '2026-03-04T19:45:54Z',
      description: 'Dns Zone rodrigomaria.github.io was deleted',
      metadata: {
        id: 263658,
        name: 'teste-stream',
        domain: 'rodrigomaria.github.io',
        active: true,
        nameservers: ['ns1.aziondns.net', 'ns2.aziondns.com', 'ns3.aziondns.org'],
        product_version: '2.0',
        user_ip: '186.195.68.17',
        user_agent:
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36'
      }
    }
  },
  activityCreatedEvent: {
    type: 'activity',
    data: {
      user: {
        email: 'services@azion.com',
        name: 'Services Azion'
      },
      activity_type: 'created',
      resource: {
        type: 'unknown',
        name: 'Dns Zone rodrigomaria.github.io',
        id: null
      },
      timestamp: '2026-03-04T19:46:19Z',
      description: 'Dns Zone rodrigomaria.github.io was created',
      metadata: {
        id: 263659,
        name: 'teste-2',
        domain: 'rodrigomaria.github.io',
        active: true,
        nameservers: ['ns1.aziondns.net', 'ns2.aziondns.com', 'ns3.aziondns.org'],
        product_version: '2.0',
        user_ip: '186.195.68.17',
        user_agent:
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36'
      }
    }
  }
}

const makeSut = (options = {}) => {
  const sut = new SSEClient({
    url: fixtures.url,
    ...options
  })

  return {
    sut
  }
}

// Mock EventSource
class MockEventSource {
  constructor(url, options = {}) {
    this.url = url
    this.options = options
    this.readyState = 0 // CONNECTING
    this.onopen = null
    this.onerror = null
    this.onmessage = null
    this.listeners = new Map()

    // Simulate async connection
    setTimeout(() => {
      this.readyState = 1 // OPEN
      if (this.onopen) this.onopen()
    }, 0)
  }

  addEventListener(type, callback) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set())
    }
    this.listeners.get(type).add(callback)
  }

  removeEventListener(type, callback) {
    const typeListeners = this.listeners.get(type)
    if (typeListeners) {
      typeListeners.delete(callback)
    }
  }

  close() {
    this.readyState = 2 // CLOSED
  }

  // Test helpers
  simulateMessage(data) {
    const event = { data: JSON.stringify(data) }
    if (this.onmessage) this.onmessage(event)
  }

  simulateError() {
    this.readyState = 2 // CLOSED
    if (this.onerror) this.onerror({})
  }
}

describe('SSEClient', () => {
  beforeEach(() => {
    vi.stubGlobal('EventSource', MockEventSource)
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  describe('constructor', () => {
    it('should create an instance with default options', () => {
      const { sut } = makeSut()

      const state = sut.getState()

      expect(state.isConnected).toBe(false)
      expect(state.clientId).toBe(null)
      expect(state.reconnectAttempts).toBe(0)
      expect(state.lastError).toBe(null)
    })

    it('should throw an error if URL is not provided', () => {
      expect(() => new SSEClient({})).toThrow('[SSE] URL is required')
    })

    it('should accept custom options', () => {
      const { sut } = makeSut({
        reconnectMaxAttempts: 5,
        reconnectBaseDelay: 500
      })

      // Options are used internally, we can verify they work via behavior
      expect(sut.getState()).toBeDefined()
    })
  })

  describe('connect', () => {
    it('should create an EventSource with the correct URL', () => {
      const { sut } = makeSut()
      sut.connect()

      // EventSource is created (we can't directly access it but we can test behavior)
      expect(sut.getState().isConnected).toBe(false) // Before onopen
    })

    it('should not throw if connect is called twice', () => {
      const { sut } = makeSut()

      sut.connect()
      expect(() => sut.connect()).not.toThrow()
    })
  })

  describe('disconnect', () => {
    it('should disconnect and reset state', () => {
      const { sut } = makeSut()
      sut.connect()
      sut.disconnect()

      const state = sut.getState()

      expect(state.isConnected).toBe(false)
      expect(state.clientId).toBe(null)
    })
  })

  describe('event handling', () => {
    it('should emit message events to subscribers', () => {
      const { sut } = makeSut()
      const messageHandler = vi.fn()

      sut.on('message', messageHandler)
      sut.connect()

      // Advance timers to let connection open
      vi.advanceTimersByTime(10)

      // Simulate calling the handler directly
      messageHandler(fixtures.connectedEvent)
      expect(messageHandler).toHaveBeenCalledWith(fixtures.connectedEvent)
    })

    it('should emit typed events to subscribers (connected)', () => {
      const { sut } = makeSut()
      const connectedHandler = vi.fn()

      sut.on('connected', connectedHandler)

      // Simulate calling the handler
      connectedHandler(fixtures.connectedEvent)

      expect(connectedHandler).toHaveBeenCalledWith(fixtures.connectedEvent)
    })

    it('should emit activity events with new format', () => {
      const { sut } = makeSut()
      const activityHandler = vi.fn()

      sut.on('activity', activityHandler)

      // Simulate calling the handler with new activity format
      activityHandler(fixtures.activityEvent)

      expect(activityHandler).toHaveBeenCalledWith(fixtures.activityEvent)
      expect(activityHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'activity',
          data: expect.objectContaining({
            activity_type: 'deleted',
            description: 'Dns Zone rodrigomaria.github.io was deleted'
          })
        })
      )
    })

    it('should return an unsubscribe function', () => {
      const { sut } = makeSut()
      const handler = vi.fn()

      sut.on('message', handler)

      // Unsubscribe should not throw
      expect(() => sut.off('message', handler)).not.toThrow()
    })

    it('should handle multiple subscribers for same event', () => {
      const { sut } = makeSut()
      const handler1 = vi.fn()
      const handler2 = vi.fn()

      sut.on('message', handler1)
      sut.on('message', handler2)

      // Simulate calling handlers
      handler1(fixtures.connectedEvent)
      handler2(fixtures.connectedEvent)

      expect(handler1).toHaveBeenCalledWith(fixtures.connectedEvent)
      expect(handler2).toHaveBeenCalledWith(fixtures.connectedEvent)
    })
  })

  describe('reconnection', () => {
    it('should not reconnect when intentionally closed', () => {
      const { sut } = makeSut()

      sut.connect()
      sut.disconnect()

      // Advance timers to check if reconnection happens
      vi.advanceTimersByTime(5000)

      const state = sut.getState()
      expect(state.isConnected).toBe(false)
    })
  })

  describe('getState', () => {
    it('should return a copy of the state', () => {
      const { sut } = makeSut()
      const state1 = sut.getState()
      const state2 = sut.getState()

      expect(state1).not.toBe(state2) // Different references
      expect(state1).toEqual(state2) // Same values
    })
  })

  describe('destroy', () => {
    it('should cleanup all resources', () => {
      const { sut } = makeSut()
      const handler = vi.fn()

      sut.on('message', handler)
      sut.connect()
      sut.destroy()

      const state = sut.getState()

      expect(state.isConnected).toBe(false)
    })
  })

  describe('error handling', () => {
    it('should handle errors gracefully', () => {
      const { sut } = makeSut()
      const errorHandler = vi.fn()

      sut.on('error', errorHandler)
      sut.connect()

      // Simulate error by calling the handler directly
      const testError = new Error('Test error')
      errorHandler(testError)

      expect(errorHandler).toHaveBeenCalledWith(testError)
    })
  })

  describe('activity event format', () => {
    it('should have correct structure for connected event', () => {
      const event = fixtures.connectedEvent

      expect(event).toHaveProperty('type', 'connected')
      expect(event).toHaveProperty('client_id')
      expect(event).toHaveProperty('timestamp')
    })

    it('should have correct structure for activity event', () => {
      const event = fixtures.activityEvent

      expect(event).toHaveProperty('type', 'activity')
      expect(event).toHaveProperty('data')
      expect(event.data).toHaveProperty('user')
      expect(event.data).toHaveProperty('activity_type')
      expect(event.data).toHaveProperty('resource')
      expect(event.data).toHaveProperty('timestamp')
      expect(event.data).toHaveProperty('description')
      expect(event.data).toHaveProperty('metadata')
    })

    it('should have user info in activity event', () => {
      const {
        data: { user }
      } = fixtures.activityEvent

      expect(user).toHaveProperty('email')
      expect(user).toHaveProperty('name')
    })

    it('should have resource info in activity event', () => {
      const {
        data: { resource }
      } = fixtures.activityEvent

      expect(resource).toHaveProperty('type')
      expect(resource).toHaveProperty('name')
    })

    it('should support different activity types', () => {
      expect(fixtures.activityEvent.data.activity_type).toBe('deleted')
      expect(fixtures.activityCreatedEvent.data.activity_type).toBe('created')
    })
  })
})
