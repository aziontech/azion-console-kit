// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setImmediate } from 'node:timers'
import { set, del, createStore } from 'idb-keyval'
import { createIDBPersister } from '@/services/v2/base/query/indexedDbPersister'

/**
 * indexedDbPersister — persists the TanStack cache with real AES-GCM
 * encryption on top (test-maturity deep pass). idb-keyval (the IndexedDB
 * wrapper) is the boundary: an in-memory store stands in; encryption is REAL
 * (Node WebCrypto), so the roundtrip proves data is stored ciphered and comes
 * back intact.
 */
vi.mock('idb-keyval', () => ({
  createStore: vi.fn(() => new Map()),
  get: vi.fn(async (key, store) => store.get(key)),
  set: vi.fn(async (key, value, store) => {
    store.set(key, value)
  }),
  del: vi.fn(async (key, store) => {
    store.delete(key)
  })
}))

const CONFIG = { idbName: 'azion-spec-db', storeName: 'spec-store', cacheKey: 'spec-cache' }
const THROTTLE = 2100

// Writes to the persister's OWN key only — the encryption module shares the
// mocked idb-keyval and stores its CryptoKey through the same `set`.
const cacheWrites = () => set.mock.calls.filter((call) => call[0] === CONFIG.cacheKey)

// Real WebCrypto resolves outside the fake clock, so flush = fire the
// throttle timer, then yield real ticks until the async write chain lands.
const flushPersist = async (expectWrite = true) => {
  await vi.advanceTimersByTimeAsync(THROTTLE)
  for (let tick = 0; tick < 50; tick++) {
    if (expectWrite && cacheWrites().length > 0) return
    await new Promise((resolve) => setImmediate(resolve))
  }
}

const cacheSnapshot = (queries) => ({ clientState: { queries, mutations: [] } })
const query = (overrides = {}) => ({
  queryKey: ['account', 'info'],
  state: { data: { token: 'secret-1' }, dataUpdatedAt: 1 },
  meta: {},
  ...overrides
})

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
  vi.clearAllMocks()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('persist → restore roundtrip with real encryption', () => {
  it('stores query data CIPHERED and restores it back to plaintext', async () => {
    const persister = createIDBPersister(CONFIG)
    const client = { ...cacheSnapshot([]), queries: [query()] }

    persister.persistClient(client)
    await flushPersist()

    const stored = cacheWrites().at(-1)[1]
    expect(stored.queries[0].state.data).toBeInstanceOf(ArrayBuffer)
    expect(stored.queries[0].meta.encrypted).toBe(true)

    const restored = await persister.restoreClient()
    expect(restored.queries[0].state.data).toEqual({ token: 'secret-1' })
    expect(restored.queries[0].meta.encrypted).toBe(false)
  })

  it('throttles writes: only the LAST snapshot inside the window is persisted', async () => {
    const persister = createIDBPersister(CONFIG)

    persister.persistClient({ queries: [query({ state: { data: { round: 1 } } })] })
    persister.persistClient({ queries: [query({ state: { data: { round: 2 } } })] })
    await flushPersist()

    expect(cacheWrites()).toHaveLength(1)
    const restored = await persister.restoreClient()
    expect(restored.queries[0].state.data).toEqual({ round: 2 })
  })

  it('cancelPendingPersist drops a scheduled write (ENG-46685 switch-account teardown)', async () => {
    // Merged from PR #3658: the account-switch teardown must be able to cancel
    // an in-flight throttled persist so the OLD account cache never lands.
    const persister = createIDBPersister(CONFIG)

    persister.persistClient({ queries: [query()] })
    persister.cancelPendingPersist()
    await flushPersist(false)

    expect(cacheWrites()).toHaveLength(0)
  })

  it('queries without data pass through unencrypted', async () => {
    const persister = createIDBPersister(CONFIG)

    persister.persistClient({ queries: [query({ state: { dataUpdatedAt: 1 } })] })
    await flushPersist()

    const stored = cacheWrites().at(-1)[1]
    expect(stored.queries[0].meta?.encrypted).toBeUndefined()
  })
})

describe('restore safety', () => {
  it('discards legacy string-encrypted entries instead of migrating them', async () => {
    const persister = createIDBPersister(CONFIG)
    const store = createStore.mock.results.at(-1).value
    store.set(CONFIG.cacheKey, {
      queries: [
        query({ meta: { encrypted: true }, state: { data: 'legacy-base64-blob' } }),
        query({ queryKey: ['plain'], state: { data: undefined, dataUpdatedAt: 2 }, meta: {} })
      ]
    })

    const restored = await persister.restoreClient()

    expect(restored.queries).toHaveLength(1)
    expect(restored.queries[0].queryKey).toEqual(['plain'])
  })

  it('majority corruption wipes the cache and restores nothing (fail-closed)', async () => {
    const persister = createIDBPersister(CONFIG)
    const store = createStore.mock.results.at(-1).value
    const corrupt = () =>
      query({ meta: { encrypted: true }, state: { data: new Uint8Array(64).buffer } })
    store.set(CONFIG.cacheKey, { queries: [corrupt(), corrupt()] })

    const restored = await persister.restoreClient()

    expect(restored).toBeUndefined()
    expect(del).toHaveBeenCalledWith(CONFIG.cacheKey, store)
  })

  it('an empty store restores undefined and still signals restore completion', async () => {
    const onRestoreComplete = vi.fn()
    const persister = createIDBPersister(CONFIG, onRestoreComplete)

    const restored = await persister.restoreClient()
    await new Promise((resolve) => setImmediate(resolve))

    expect(restored).toBeUndefined()
    expect(onRestoreComplete).toHaveBeenCalledWith(null)
  })

  it('removeClient deletes the cache entry', async () => {
    const persister = createIDBPersister(CONFIG)

    await persister.removeClient()

    expect(del).toHaveBeenCalledWith(CONFIG.cacheKey, expect.anything())
  })
})

describe('IndexedDB unavailable (private browsing)', () => {
  it('falls back to a noop persister that never throws', async () => {
    createStore.mockImplementationOnce(() => {
      throw new Error('IDB blocked')
    })
    const onRestoreComplete = vi.fn()
    const persister = createIDBPersister(CONFIG, onRestoreComplete)

    expect(() => persister.persistClient({ queries: [query()] })).not.toThrow()
    await expect(persister.restoreClient()).resolves.toBeUndefined()
    await expect(persister.removeClient()).resolves.toBeUndefined()
    await flushPersist(false)
    expect(onRestoreComplete).toHaveBeenCalledWith(null)
    expect(cacheWrites()).toHaveLength(0)
  })
})
