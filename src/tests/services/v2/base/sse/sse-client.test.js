// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { SSEClient } from '@/services/v2/base/sse/sse-client'

/**
 * SSEClient — the EventSource wrapper feeding cache-sync (test-maturity deep
 * pass). The browser EventSource is the boundary: a deterministic fake stands
 * in, and fake timers drive the reconnect/backoff clock.
 */
class FakeEventSource {
  static instances = []
  static CONNECTING = 0
  static OPEN = 1
  static CLOSED = 2

  constructor(url, options) {
    this.url = url
    this.options = options
    this.readyState = FakeEventSource.CONNECTING
    this.namedListeners = {}
    this.onopen = null
    this.onerror = null
    this.onmessage = null
    this.closed = false
    FakeEventSource.instances.push(this)
  }

  addEventListener(type, callback) {
    ;(this.namedListeners[type] ??= new Set()).add(callback)
  }

  removeEventListener(type, callback) {
    this.namedListeners[type]?.delete(callback)
  }

  close() {
    this.closed = true
    this.readyState = FakeEventSource.CLOSED
  }

  emitOpen() {
    this.readyState = FakeEventSource.OPEN
    this.onopen?.()
  }

  emitError() {
    this.readyState = FakeEventSource.CLOSED
    this.onerror?.()
  }

  emitMessage(data) {
    this.onmessage?.({ data })
  }

  emitNamed(type) {
    this.namedListeners[type]?.forEach((callback) => callback({ type }))
  }
}

const lastSource = () => FakeEventSource.instances.at(-1)

const makeClient = (options = {}) =>
  new SSEClient({
    url: '/sse',
    reconnectBaseDelay: 100,
    reconnectMaxDelay: 1000,
    serverErrorMaxAttempts: 3,
    reconnectMaxAttempts: 2,
    connectionStabilityThreshold: 5000,
    ...options
  })

beforeEach(() => {
  vi.useFakeTimers()
  FakeEventSource.instances = []
  vi.stubGlobal('EventSource', FakeEventSource)
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('connection and message dispatch', () => {
  it('requires a url and opens the EventSource with credentials', () => {
    expect(() => new SSEClient({})).toThrow('[SSE] URL is required')

    makeClient().connect()

    expect(lastSource().url).toBe('/sse')
    expect(lastSource().options).toEqual({ withCredentials: true })
  })

  it('routes JSON messages to type-specific listeners and captures the client id', () => {
    const client = makeClient()
    const onActivity = vi.fn()
    const onMessage = vi.fn()
    client.on('activity', onActivity)
    client.on('message', onMessage)
    client.connect()
    lastSource().emitOpen()

    lastSource().emitMessage(JSON.stringify({ type: 'connected', client_id: 'client-9' }))
    lastSource().emitMessage(
      JSON.stringify({ type: 'activity', data: { activity_type: 'edited' } })
    )

    expect(client.getState().clientId).toBe('client-9')
    expect(onActivity).toHaveBeenCalledTimes(1)
    expect(onMessage).toHaveBeenCalledTimes(2)
  })

  it('non-JSON payloads are ignored without breaking the stream', () => {
    const client = makeClient()
    const onMessage = vi.fn()
    client.on('message', onMessage)
    client.connect()
    lastSource().emitOpen()

    expect(() => lastSource().emitMessage(': keep-alive comment')).not.toThrow()
    expect(onMessage).not.toHaveBeenCalled()
  })

  it('named ping events reach ping listeners', () => {
    const client = makeClient()
    const onPing = vi.fn()
    client.on('ping', onPing)
    client.connect()

    lastSource().emitNamed('ping')

    expect(onPing).toHaveBeenCalledWith({ type: 'ping' })
  })

  it('a broken listener never silences the others', () => {
    const client = makeClient()
    const healthy = vi.fn()
    client.on('open', () => {
      throw new Error('listener bug')
    })
    client.on('open', healthy)
    client.connect()

    expect(() => lastSource().emitOpen()).not.toThrow()
    expect(healthy).toHaveBeenCalled()
  })
})

describe('error classification — server vs network', () => {
  it('failure BEFORE ever opening is a server error with aggressive backoff', () => {
    const client = makeClient()
    const onServerError = vi.fn()
    client.on('server_error', onServerError)
    client.connect()

    lastSource().emitError()

    expect(onServerError).toHaveBeenCalledWith({ attempts: 1, maxAttempts: 3, retryable: true })
    expect(FakeEventSource.instances).toHaveLength(1)
    vi.advanceTimersByTime(200) // base 100 × multiplier 2^1
    expect(FakeEventSource.instances).toHaveLength(2)
  })

  it('gives up with server_unavailable after max consecutive server errors', () => {
    const client = makeClient()
    const onUnavailable = vi.fn()
    client.on('server_unavailable', onUnavailable)
    client.connect()

    lastSource().emitError()
    vi.advanceTimersByTime(1000)
    lastSource().emitError()
    vi.advanceTimersByTime(1000)
    lastSource().emitError()

    expect(onUnavailable).toHaveBeenCalledWith({ attempts: 3 })
    const instancesAfterGivingUp = FakeEventSource.instances.length
    vi.advanceTimersByTime(60000)
    expect(FakeEventSource.instances).toHaveLength(instancesAfterGivingUp)
  })

  it('failure on a STABLE connection is a network error with exponential backoff', () => {
    const client = makeClient()
    const onServerError = vi.fn()
    client.on('server_error', onServerError)
    client.connect()
    lastSource().emitOpen()
    vi.advanceTimersByTime(6000) // beyond the 5s stability threshold

    lastSource().emitError()

    expect(onServerError).not.toHaveBeenCalled()
    vi.advanceTimersByTime(100) // network backoff: base × 2^0
    expect(FakeEventSource.instances).toHaveLength(2)
    expect(client.getState().reconnectAttempts).toBe(1)
  })

  it('stops after reconnectMaxAttempts network retries', () => {
    const client = makeClient({ reconnectMaxAttempts: 1 })
    const onMax = vi.fn()
    client.on('maxReconnectAttempts', onMax)
    client.connect()
    const stabilize = () => {
      lastSource().emitOpen()
      vi.advanceTimersByTime(6000)
    }
    stabilize()

    lastSource().emitError() // retry 1 scheduled
    vi.advanceTimersByTime(100)
    // the retry fails too (no reopen — a successful open resets the counter,
    // which is itself pinned by the network-backoff test above)
    lastSource().emitError()

    expect(onMax).toHaveBeenCalledWith({ attempts: 1 })
  })

  it('resetServerErrorState re-arms a manual retry after server_unavailable', () => {
    const client = makeClient({ serverErrorMaxAttempts: 1 })
    const onUnavailable = vi.fn()
    client.on('server_unavailable', onUnavailable)
    client.connect()
    lastSource().emitError()
    expect(onUnavailable).toHaveBeenCalled()

    client.resetServerErrorState()
    client.connect()
    lastSource().emitOpen()

    expect(client.getState().isConnected).toBe(true)
    expect(client.getState().serverErrorAttempts).toBe(0)
  })
})

describe('teardown', () => {
  it('disconnect closes the source, emits close and never reconnects', () => {
    const client = makeClient()
    const onClose = vi.fn()
    client.on('close', onClose)
    client.connect()
    const source = lastSource()
    source.emitOpen()

    client.disconnect()
    vi.advanceTimersByTime(60000)

    expect(source.closed).toBe(true)
    expect(onClose).toHaveBeenCalled()
    expect(FakeEventSource.instances).toHaveLength(1)
    expect(client.getState().isConnected).toBe(false)
  })

  it('unsubscribe (the function returned by on) detaches the listener', () => {
    const client = makeClient()
    const listener = vi.fn()
    const unsubscribe = client.on('open', listener)
    client.connect()

    unsubscribe()
    lastSource().emitOpen()

    expect(listener).not.toHaveBeenCalled()
  })
})
