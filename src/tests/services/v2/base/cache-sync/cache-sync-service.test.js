import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'

const mockSSEClient = {
  connect: vi.fn(),
  disconnect: vi.fn(),
  destroy: vi.fn(),
  on: vi.fn(() => () => {}),
  off: vi.fn(),
  getState: vi.fn(() => ({ isConnected: false, clientId: null })),
  _listeners: new Map(),
  _emit(event, data) {
    this._listeners.get(event)?.forEach((cb) => cb(data))
  }
}

mockSSEClient.on.mockImplementation((event, cb) => {
  if (!mockSSEClient._listeners.has(event)) {
    mockSSEClient._listeners.set(event, new Set())
  }
  mockSSEClient._listeners.get(event).add(cb)
  return () => mockSSEClient._listeners.get(event)?.delete(cb)
})

const mockInvalidate = vi.fn().mockResolvedValue(undefined)

let onBecomePrimaryCallback = null
// eslint-disable-next-line no-unused-vars
let onLosePrimaryCallback = null

vi.mock('@services/v2/base/sse/sse-client', () => ({
  SSEClient: vi.fn(() => mockSSEClient)
}))

vi.mock('@services/v2/base/cache-sync/cache-invalidator', () => ({
  CacheInvalidator: vi.fn(() => ({ invalidate: mockInvalidate }))
}))

vi.mock('@services/v2/base/broadcast', () => ({
  BroadcastManager: vi.fn(() => ({
    start: vi.fn(),
    close: vi.fn(),
    on: vi.fn(),
    send: vi.fn(),
    tabId: 'test-tab'
  })),
  TabCoordinator: vi.fn((_broadcast, callbacks) => {
    onBecomePrimaryCallback = callbacks.onBecomePrimary
    onLosePrimaryCallback = callbacks.onLosePrimary
    return {
      start: vi.fn(() => onBecomePrimaryCallback?.()),
      stop: vi.fn(),
      isPrimary: true
    }
  })
}))

import { SSEClient } from '@services/v2/base/sse/sse-client'

describe('CacheSyncService', () => {
  let cacheSyncService, startCacheSync, resetCacheSync

  beforeEach(async () => {
    vi.clearAllMocks()
    mockSSEClient._listeners.clear()
    mockSSEClient.on.mockImplementation((event, cb) => {
      if (!mockSSEClient._listeners.has(event)) {
        mockSSEClient._listeners.set(event, new Set())
      }
      mockSSEClient._listeners.get(event).add(cb)
      return () => mockSSEClient._listeners.get(event)?.delete(cb)
    })

    vi.resetModules()
    const mod = await import('@services/v2/base/cache-sync/cache-sync-service')
    cacheSyncService = mod.cacheSyncService
    startCacheSync = mod.startCacheSync
    resetCacheSync = mod.resetCacheSync
  })

  afterEach(() => {
    resetCacheSync()
  })

  it('should create SSEClient and connect when becoming primary tab', () => {
    startCacheSync()

    expect(SSEClient).toHaveBeenCalledWith({
      url: '/events/stream',
      withCredentials: true
    })
    expect(mockSSEClient.connect).toHaveBeenCalled()
  })

  it('should be idempotent on multiple start calls', () => {
    startCacheSync()
    startCacheSync()

    expect(SSEClient).toHaveBeenCalledTimes(1)
  })

  it('should destroy SSEClient on stop', () => {
    startCacheSync()
    resetCacheSync()

    expect(mockSSEClient.destroy).toHaveBeenCalled()
  })

  it('should register all expected event listeners', () => {
    startCacheSync()

    const registeredEvents = mockSSEClient.on.mock.calls.map((call) => call[0])
    expect(registeredEvents).toContain('open')
    expect(registeredEvents).toContain('connected')
    expect(registeredEvents).toContain('activity')
    expect(registeredEvents).toContain('close')
    expect(registeredEvents).toContain('error')
    expect(registeredEvents).toContain('maxReconnectAttempts')
  })

  it('should call invalidator on activity event', () => {
    startCacheSync()

    const activityEvent = { data: { description: 'Edge Application was updated' } }
    mockSSEClient._emit('activity', activityEvent)

    expect(mockInvalidate).toHaveBeenCalledWith(activityEvent)
  })

  it('should update state on connected event', () => {
    startCacheSync()

    mockSSEClient._emit('connected', { client_id: 'abc123' })

    expect(cacheSyncService.state.isConnected).toBe(true)
    expect(cacheSyncService.state.clientId).toBe('abc123')
  })

  it('should update state on close event', () => {
    startCacheSync()

    mockSSEClient._emit('connected', { client_id: 'abc123' })
    mockSSEClient._emit('close')

    expect(cacheSyncService.isConnected).toBe(false)
  })

  it('should allow restart after stop', () => {
    startCacheSync()
    resetCacheSync()
    startCacheSync()

    expect(SSEClient).toHaveBeenCalledTimes(2)
  })
})
