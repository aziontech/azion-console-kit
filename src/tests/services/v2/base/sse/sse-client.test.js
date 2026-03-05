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
      user: { email: 'services@azion.com', name: 'Services Azion' },
      activity_type: 'deleted',
      resource: { type: 'unknown', name: 'Dns Zone rodrigomaria.github.io', id: null },
      timestamp: '2026-03-04T19:45:54Z',
      description: 'Dns Zone rodrigomaria.github.io was deleted',
      metadata: { id: 263658 }
    }
  }
}

let lastEventSource = null

class MockEventSource {
  static CONNECTING = 0
  static OPEN = 1
  static CLOSED = 2

  constructor(url, options = {}) {
    this.url = url
    this.withCredentials = options.withCredentials ?? false
    this.readyState = MockEventSource.CONNECTING
    this.onopen = null
    this.onerror = null
    this.onmessage = null
    lastEventSource = this

    setTimeout(() => {
      if (this.readyState !== MockEventSource.CLOSED) {
        this.readyState = MockEventSource.OPEN
        if (this.onopen) this.onopen()
      }
    }, 0)
  }

  close() {
    this.readyState = MockEventSource.CLOSED
  }

  simulateMessage(data) {
    const event = { data: JSON.stringify(data) }
    if (this.onmessage) this.onmessage(event)
  }

  simulateRawMessage(rawData) {
    const event = { data: rawData }
    if (this.onmessage) this.onmessage(event)
  }

  simulateError() {
    this.readyState = MockEventSource.CLOSED
    if (this.onerror) this.onerror({})
  }
}

MockEventSource.CONNECTING = 0
MockEventSource.OPEN = 1
MockEventSource.CLOSED = 2

const makeSut = (options = {}) => {
  lastEventSource = null
  const sut = new SSEClient({ url: fixtures.url, ...options })
  return {
    sut,
    getEventSource: () => lastEventSource
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
    it('should create an instance with default state', () => {
      const { sut } = makeSut()
      const state = sut.getState()

      expect(state.isConnected).toBe(false)
      expect(state.clientId).toBe(null)
      expect(state.reconnectAttempts).toBe(0)
      expect(state.lastError).toBe(null)
    })

    it('should throw if URL is not provided', () => {
      expect(() => new SSEClient({})).toThrow('[SSE] URL is required')
    })
  })

  describe('connect', () => {
    it('should create EventSource with correct URL and credentials', () => {
      const { sut, getEventSource } = makeSut()
      sut.connect()

      const es = getEventSource()
      expect(es.url).toBe(fixtures.url)
      expect(es.withCredentials).toBe(true)
    })

    it('should emit open and set isConnected on connection', () => {
      const { sut } = makeSut()
      const openHandler = vi.fn()

      sut.on('open', openHandler)
      sut.connect()
      vi.advanceTimersByTime(1)

      expect(openHandler).toHaveBeenCalled()
      expect(sut.getState().isConnected).toBe(true)
      expect(sut.getState().reconnectAttempts).toBe(0)
    })

    it('should close existing connection and create new one when called twice', () => {
      const { sut } = makeSut()
      sut.connect()
      const firstES = lastEventSource

      sut.connect()
      expect(firstES.readyState).toBe(MockEventSource.CLOSED)
      expect(lastEventSource).not.toBe(firstES)
    })
  })

  describe('disconnect', () => {
    it('should close connection and emit close event', () => {
      const { sut } = makeSut()
      const closeHandler = vi.fn()

      sut.on('close', closeHandler)
      sut.connect()
      vi.advanceTimersByTime(1)

      sut.disconnect()

      expect(closeHandler).toHaveBeenCalled()
      expect(sut.getState().isConnected).toBe(false)
      expect(sut.getState().clientId).toBe(null)
    })
  })

  describe('message handling', () => {
    it('should parse JSON and emit to message listeners', () => {
      const { sut, getEventSource } = makeSut()
      const messageHandler = vi.fn()

      sut.on('message', messageHandler)
      sut.connect()
      vi.advanceTimersByTime(1)

      getEventSource().simulateMessage(fixtures.connectedEvent)

      expect(messageHandler).toHaveBeenCalledWith(fixtures.connectedEvent)
    })

    it('should emit typed events based on data.type', () => {
      const { sut, getEventSource } = makeSut()
      const connectedHandler = vi.fn()

      sut.on('connected', connectedHandler)
      sut.connect()
      vi.advanceTimersByTime(1)

      getEventSource().simulateMessage(fixtures.connectedEvent)

      expect(connectedHandler).toHaveBeenCalledWith(fixtures.connectedEvent)
    })

    it('should store clientId from connected event', () => {
      const { sut, getEventSource } = makeSut()

      sut.connect()
      vi.advanceTimersByTime(1)
      getEventSource().simulateMessage(fixtures.connectedEvent)

      expect(sut.getState().clientId).toBe('0001a')
    })

    it('should emit activity events', () => {
      const { sut, getEventSource } = makeSut()
      const activityHandler = vi.fn()

      sut.on('activity', activityHandler)
      sut.connect()
      vi.advanceTimersByTime(1)

      getEventSource().simulateMessage(fixtures.activityEvent)

      expect(activityHandler).toHaveBeenCalledWith(fixtures.activityEvent)
    })

    it('should not emit on invalid JSON', () => {
      const { sut, getEventSource } = makeSut()
      const messageHandler = vi.fn()

      sut.on('message', messageHandler)
      sut.connect()
      vi.advanceTimersByTime(1)

      getEventSource().simulateRawMessage('not-json')

      expect(messageHandler).not.toHaveBeenCalled()
    })

    it('should not process messages twice (no duplicate listener)', () => {
      const { sut, getEventSource } = makeSut()
      const messageHandler = vi.fn()

      sut.on('message', messageHandler)
      sut.connect()
      vi.advanceTimersByTime(1)

      getEventSource().simulateMessage(fixtures.connectedEvent)

      expect(messageHandler).toHaveBeenCalledTimes(1)
    })
  })

  describe('event subscription', () => {
    it('should return unsubscribe function from on()', () => {
      const { sut, getEventSource } = makeSut()
      const handler = vi.fn()

      const unsubscribe = sut.on('message', handler)
      sut.connect()
      vi.advanceTimersByTime(1)

      unsubscribe()
      getEventSource().simulateMessage(fixtures.connectedEvent)

      expect(handler).not.toHaveBeenCalled()
    })

    it('should support multiple subscribers for same event', () => {
      const { sut, getEventSource } = makeSut()
      const handler1 = vi.fn()
      const handler2 = vi.fn()

      sut.on('message', handler1)
      sut.on('message', handler2)
      sut.connect()
      vi.advanceTimersByTime(1)

      getEventSource().simulateMessage(fixtures.connectedEvent)

      expect(handler1).toHaveBeenCalledTimes(1)
      expect(handler2).toHaveBeenCalledTimes(1)
    })
  })

  describe('reconnection', () => {
    it('should attempt reconnection with exponential backoff', () => {
      const { sut } = makeSut({ reconnectMaxAttempts: 3, reconnectBaseDelay: 1000 })
      sut.connect()
      vi.advanceTimersByTime(1)

      lastEventSource.simulateError()
      expect(sut.getState().reconnectAttempts).toBe(1)

      vi.advanceTimersByTime(1000)
      lastEventSource.simulateError()
      expect(sut.getState().reconnectAttempts).toBe(2)

      vi.advanceTimersByTime(2000)
      lastEventSource.simulateError()
      expect(sut.getState().reconnectAttempts).toBe(3)
    })

    it('should emit maxReconnectAttempts after exhausting retries', () => {
      const { sut } = makeSut({ reconnectMaxAttempts: 1, reconnectBaseDelay: 100 })
      const maxHandler = vi.fn()

      sut.on('maxReconnectAttempts', maxHandler)
      sut.connect()
      vi.advanceTimersByTime(1)

      lastEventSource.simulateError()
      vi.advanceTimersByTime(100)

      lastEventSource.simulateError()

      expect(maxHandler).toHaveBeenCalled()
    })

    it('should not reconnect after intentional disconnect', () => {
      const { sut } = makeSut()

      sut.connect()
      vi.advanceTimersByTime(1)

      sut.disconnect()
      vi.advanceTimersByTime(60000)

      expect(sut.getState().isConnected).toBe(false)
      expect(sut.getState().reconnectAttempts).toBe(0)
    })
  })

  describe('getState', () => {
    it('should return immutable copy', () => {
      const { sut } = makeSut()
      const state1 = sut.getState()
      const state2 = sut.getState()

      expect(state1).not.toBe(state2)
      expect(state1).toEqual(state2)
    })
  })

  describe('destroy', () => {
    it('should disconnect and clear all listeners', () => {
      const { sut, getEventSource } = makeSut()
      const handler = vi.fn()

      sut.on('message', handler)
      sut.connect()
      vi.advanceTimersByTime(1)

      sut.destroy()

      expect(sut.getState().isConnected).toBe(false)
    })
  })
})
