// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setImmediate } from 'node:timers'
import { BroadcastChannel as NodeBroadcastChannel } from 'node:worker_threads'

/**
 * cacheSyncService — end-to-end orchestration: this tab wins the primary
 * election, opens the SSE stream, and each activity event invalidates the
 * local cache and broadcasts to other tabs. Boundaries: EventSource (fake),
 * BroadcastChannel (real Node impl), queryClient invalidation (spied).
 * Module-singleton state → fresh import per test.
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
    this.onopen = null
    this.onerror = null
    this.onmessage = null
    this.closed = false
    FakeEventSource.instances.push(this)
  }

  addEventListener() {}
  removeEventListener() {}

  close() {
    this.closed = true
    this.readyState = FakeEventSource.CLOSED
  }

  emitOpen() {
    this.readyState = FakeEventSource.OPEN
    this.onopen?.()
  }

  emitJson(payload) {
    this.onmessage?.({ data: JSON.stringify(payload) })
  }
}

const ELECTION_MS = 1100
const peers = []
let queryClient
let invalidateSpy
let service
let startCacheSync
let resetCacheSync

const makePeerTab = async () => {
  const { BroadcastManager } = await import('@/services/v2/base/broadcast')
  const peer = new BroadcastManager('cache-sync')
  peer.start()
  peers.push(peer)
  return peer
}

const startAsPrimary = async () => {
  startCacheSync()
  await vi.advanceTimersByTimeAsync(ELECTION_MS)
  const source = FakeEventSource.instances.at(-1)
  expect(source).toBeDefined()
  return source
}

const waitReal = async (predicate) => {
  for (let tick = 0; tick < 100; tick++) {
    if (predicate()) return
    await new Promise((resolve) => setImmediate(resolve))
  }
}

beforeEach(async () => {
  vi.resetModules()
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval'] })
  vi.stubGlobal('BroadcastChannel', NodeBroadcastChannel)
  vi.stubGlobal('EventSource', FakeEventSource)
  FakeEventSource.instances = []
  ;({ queryClient } = await import('@/services/v2/base/query/queryClient'))
  invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries').mockResolvedValue()
  ;({
    cacheSyncService: service,
    startCacheSync,
    resetCacheSync
  } = await import('@/services/v2/base/cache-sync/cache-sync-service'))
})

afterEach(() => {
  resetCacheSync()
  while (peers.length) peers.pop().close()
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('primary election and connection state', () => {
  it('a lone tab becomes primary and opens the SSE stream with credentials', async () => {
    const source = await startAsPrimary()

    expect(source.url).toBe('/sse')
    expect(source.options).toEqual({ withCredentials: true })
  })

  it('tracks connection state from the stream events', async () => {
    const source = await startAsPrimary()

    source.emitOpen()
    source.emitJson({ type: 'connected', client_id: 'client-77' })

    expect(service.isConnected).toBe(true)
    expect(service.state.clientId).toBe('client-77')
  })
})

describe('activity fan-out', () => {
  it('an SSE activity invalidates the local cache AND broadcasts the keys to other tabs', async () => {
    const { queryKeys } = await import('@/services/v2/base/query/queryKeys')
    const otherTab = await makePeerTab()
    const received = vi.fn()
    otherTab.on('CACHE_INVALIDATION', received)
    const source = await startAsPrimary()
    source.emitOpen()

    source.emitJson({
      type: 'activity',
      data: {
        resource: { type: 'application' },
        activity_type: 'edited',
        metadata: { id: 42 }
      }
    })

    await waitReal(() => received.mock.calls.length > 0)
    expect(received.mock.calls[0][0].keys).toEqual([
      queryKeys.application.all,
      queryKeys.application.detail(42)
    ])
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.application.all,
      refetchType: 'none'
    })
  })

  it('a CACHE_INVALIDATION broadcast from ANOTHER tab invalidates locally', async () => {
    const otherTab = await makePeerTab()
    startCacheSync()

    otherTab.send('CACHE_INVALIDATION', { keys: [['workloads']] })

    await waitReal(() => invalidateSpy.mock.calls.length > 0)
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['workloads'] })
  })
})

describe('teardown', () => {
  it('stop closes the SSE stream and resets state; a later start reconnects', async () => {
    const source = await startAsPrimary()
    source.emitOpen()

    resetCacheSync()

    expect(source.closed).toBe(true)
    expect(service.isConnected).toBe(false)

    startCacheSync()
    await vi.advanceTimersByTimeAsync(ELECTION_MS)
    expect(FakeEventSource.instances.length).toBe(2)
  })
})
