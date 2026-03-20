import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { SSEClient } from '@services/v2/base/sse/sse-client'

const fixtures = {
  url: 'https://stage-beholder.azion.net/sse',
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
  },
  pingEvent: {
    type: 'ping'
  },
  closedEvent: {
    type: 'closed',
    reason: 'timeout'
  }
}

/**
 * Creates a mock ReadableStream that yields SSE events
 */
function createMockReadableStream(chunks = []) {
  let index = 0
  const encoder = new TextEncoder()

  return {
    getReader: () => ({
      read: vi.fn(async () => {
        if (index >= chunks.length) {
          return { done: true, value: undefined }
        }
        const chunk = chunks[index++]
        return { done: false, value: encoder.encode(chunk) }
      }),
      cancel: vi.fn(async () => {})
    })
  }
}

let mockFetch = null
let lastFetchRequest = null

const makeSut = (options = {}) => {
  lastFetchRequest = null
  const sut = new SSEClient({ url: fixtures.url, ...options })
  return {
    sut,
    getLastRequest: () => lastFetchRequest
  }
}

describe('SSEClient', () => {
  beforeEach(() => {
    vi.useFakeTimers()

    mockFetch = vi.fn(async (url, options) => {
      lastFetchRequest = { url, options }

      return {
        ok: true,
        status: 200,
        body: createMockReadableStream(['data: {"type":"connected","client_id":"test"}\n\n'])
      }
    })

    vi.stubGlobal('fetch', mockFetch)
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
    it('should call fetch with correct URL and headers', async () => {
      const { sut } = makeSut({ headers: { 'X-Custom': 'value' } })
      sut.connect()
      await vi.runAllTimersAsync()

      expect(mockFetch).toHaveBeenCalledWith(
        fixtures.url,
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            Accept: 'text/event-stream',
            'X-Custom': 'value'
          }),
          credentials: 'include',
          mode: 'cors'
        })
      )
    })

    it('should emit open event on successful connection', async () => {
      const { sut } = makeSut()
      const openHandler = vi.fn()

      sut.on('open', openHandler)
      sut.connect()
      await vi.runAllTimersAsync()

      expect(openHandler).toHaveBeenCalled()
      expect(sut.getState().isConnected).toBe(true)
      expect(sut.getState().reconnectAttempts).toBe(0)
    })

    it('should use withCredentials=false correctly', async () => {
      const { sut } = makeSut({ withCredentials: false })
      sut.connect()
      await vi.runAllTimersAsync()

      expect(lastFetchRequest.options.credentials).toBe('same-origin')
    })
  })

  describe('disconnect', () => {
    it('should close connection and emit close event', async () => {
      const { sut } = makeSut()
      const closeHandler = vi.fn()

      sut.on('close', closeHandler)
      sut.connect()
      await vi.runAllTimersAsync()

      sut.disconnect()

      expect(closeHandler).toHaveBeenCalled()
      expect(sut.getState().isConnected).toBe(false)
      expect(sut.getState().clientId).toBe(null)
    })
  })

  describe('message handling', () => {
    it('should parse JSON and emit to message listeners', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        body: createMockReadableStream([`data: ${JSON.stringify(fixtures.connectedEvent)}\n\n`])
      })

      const { sut } = makeSut()
      const messageHandler = vi.fn()

      sut.on('message', messageHandler)
      sut.connect()
      await vi.runAllTimersAsync()

      expect(messageHandler).toHaveBeenCalledWith(fixtures.connectedEvent)
    })

    it('should emit typed events based on data.type', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        body: createMockReadableStream([`data: ${JSON.stringify(fixtures.connectedEvent)}\n\n`])
      })

      const { sut } = makeSut()
      const connectedHandler = vi.fn()

      sut.on('connected', connectedHandler)
      sut.connect()
      await vi.runAllTimersAsync()

      expect(connectedHandler).toHaveBeenCalledWith(fixtures.connectedEvent)
    })

    it('should store clientId from connected event', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        body: createMockReadableStream([`data: ${JSON.stringify(fixtures.connectedEvent)}\n\n`])
      })

      const { sut } = makeSut()
      sut.connect()
      await vi.runAllTimersAsync()

      expect(sut.getState().clientId).toBe('0001a')
    })

    it('should emit activity events', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        body: createMockReadableStream([`data: ${JSON.stringify(fixtures.activityEvent)}\n\n`])
      })

      const { sut } = makeSut()
      const activityHandler = vi.fn()

      sut.on('activity', activityHandler)
      sut.connect()
      await vi.runAllTimersAsync()

      expect(activityHandler).toHaveBeenCalledWith(fixtures.activityEvent)
    })

    it('should emit raw data for non-JSON messages', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        body: createMockReadableStream(['data: plain-text\n\n'])
      })

      const { sut } = makeSut()
      const messageHandler = vi.fn()

      sut.on('message', messageHandler)
      sut.connect()
      await vi.runAllTimersAsync()

      expect(messageHandler).toHaveBeenCalledWith({ raw: 'plain-text' })
    })
  })

  describe('ping event', () => {
    it('should emit ping event for named SSE event (event: ping)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        body: createMockReadableStream(['event: ping\ndata: {}\n\n'])
      })

      const { sut } = makeSut()
      const pingHandler = vi.fn()

      sut.on('ping', pingHandler)
      sut.connect()
      await vi.runAllTimersAsync()

      expect(pingHandler).toHaveBeenCalledWith({ type: 'ping' })
    })
  })

  describe('closed event', () => {
    it('should emit closed event to listeners', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        body: createMockReadableStream([`data: ${JSON.stringify(fixtures.closedEvent)}\n\n`])
      })

      const { sut } = makeSut()
      const closedHandler = vi.fn()

      sut.on('closed', closedHandler)
      sut.connect()
      await vi.runAllTimersAsync()

      expect(closedHandler).toHaveBeenCalledWith(fixtures.closedEvent)
    })
  })

  describe('event subscription', () => {
    it('should return unsubscribe function from on()', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        body: createMockReadableStream([`data: ${JSON.stringify(fixtures.connectedEvent)}\n\n`])
      })

      const { sut } = makeSut()
      const handler = vi.fn()

      const unsubscribe = sut.on('message', handler)
      sut.connect()
      await vi.runAllTimersAsync()

      unsubscribe()

      // Reconnect with new data
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        body: createMockReadableStream([`data: ${JSON.stringify(fixtures.activityEvent)}\n\n`])
      })

      sut.connect()
      await vi.runAllTimersAsync()

      expect(handler).toHaveBeenCalledTimes(1) // Only from first connection
    })

    it('should support multiple subscribers for same event', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        body: createMockReadableStream([`data: ${JSON.stringify(fixtures.connectedEvent)}\n\n`])
      })

      const { sut } = makeSut()
      const handler1 = vi.fn()
      const handler2 = vi.fn()

      sut.on('message', handler1)
      sut.on('message', handler2)
      sut.connect()
      await vi.runAllTimersAsync()

      expect(handler1).toHaveBeenCalledTimes(1)
      expect(handler2).toHaveBeenCalledTimes(1)
    })
  })

  describe('reconnection', () => {
    it('should attempt reconnection with exponential backoff on error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))
      mockFetch.mockRejectedValueOnce(new Error('Network error'))
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        body: createMockReadableStream(['data: {"type":"connected"}\n\n'])
      })

      const { sut } = makeSut({ reconnectMaxAttempts: 3, reconnectBaseDelay: 1000 })
      const errorHandler = vi.fn()

      sut.on('error', errorHandler)
      sut.connect()
      await vi.runAllTimersAsync()

      expect(errorHandler).toHaveBeenCalled()
      expect(sut.getState().reconnectAttempts).toBe(1)
    })

    it('should emit maxReconnectAttempts after exhausting retries', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))

      const { sut } = makeSut({ reconnectMaxAttempts: 2, reconnectBaseDelay: 100 })
      const maxHandler = vi.fn()

      sut.on('maxReconnectAttempts', maxHandler)
      sut.connect()
      await vi.runAllTimersAsync()

      expect(maxHandler).toHaveBeenCalled()
    })

    it('should not reconnect after intentional disconnect', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        body: createMockReadableStream(['data: {"type":"connected"}\n\n'])
      })

      const { sut } = makeSut()

      sut.connect()
      await vi.runAllTimersAsync()

      sut.disconnect()
      await vi.runAllTimersAsync()

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
    it('should disconnect and clear all listeners', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        body: createMockReadableStream(['data: {"type":"connected"}\n\n'])
      })

      const { sut } = makeSut()
      const handler = vi.fn()

      sut.on('message', handler)
      sut.connect()
      await vi.runAllTimersAsync()

      sut.destroy()

      expect(sut.getState().isConnected).toBe(false)
    })
  })

  describe('custom headers', () => {
    it('should include custom headers in request', async () => {
      const customHeaders = {
        'X-Custom-Header': 'custom-value',
        Cookie: 'session=abc123'
      }

      const { sut } = makeSut({ headers: customHeaders })
      sut.connect()
      await vi.runAllTimersAsync()

      expect(lastFetchRequest.options.headers).toMatchObject(customHeaders)
    })
  })

  describe('error handling', () => {
    it('should handle non-ok HTTP responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized'
      })

      const { sut } = makeSut()
      const errorHandler = vi.fn()

      sut.on('error', errorHandler)
      sut.connect()
      await vi.runAllTimersAsync()

      expect(errorHandler).toHaveBeenCalled()
      expect(errorHandler.mock.calls[0][0].message).toContain('401')
    })
  })
})
