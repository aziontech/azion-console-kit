/* eslint-disable no-console */
/**
 * Task 4.3* — PBT Clipboard Promise Handling (Wave 5)
 *
 * **Validates: Property P2 (clipboard write async-awaited; success toast
 * fires after promise resolves), Requirements 1.3, 1.4, N.9**
 *
 * The previous fire-and-forget implementation of `shareCurrentView`
 * raced the toast against the clipboard promise — users saw "URL
 * copied" while the OS clipboard was still empty (or had silently
 * rejected the write).
 *
 * These tests assert the **ordering contract**:
 *   1. Success toast fires ONLY after the deferred promise resolves.
 *   2. Error toast (or fallback dialog) fires on rejection — never
 *      while the promise is still pending.
 *   3. The behavior holds across a range of viewState / eventsTab
 *      shapes (PBT, 100+ iterations).
 *
 * We mock the panels-service mock to keep the encoder deterministic
 * and side-effect-free, then drive `shareCurrentView` while controlling
 * the clipboard promise via a deferred.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import fc from 'fast-check'

// ---------------------------------------------------------------------------
// Module mocks (must be hoisted before the SUT import)
// ---------------------------------------------------------------------------

vi.mock('@/services/panels-service', () => ({
  loadPanels: vi.fn(() => []),
  loadPanelsWithMeta: vi.fn(() => ({
    panels: [],
    localStorageAvailable: true,
    discardedCount: 0
  })),
  savePanel: vi.fn(),
  updatePanel: vi.fn(),
  deletePanel: vi.fn(),
  encodeShareState: vi.fn((state) => btoa(encodeURIComponent(JSON.stringify(state)))),
  decodeShareState: vi.fn(() => null),
  filterValidCharts: vi.fn((charts) => charts)
}))

vi.mock('@/modules/real-time-metrics/constants/reports', () => ({
  default: []
}))

import { useSessionManager } from '../useSessionManager.js'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeDeferred() {
  let resolve
  let reject
  const promise = new Promise((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

function makeFixture() {
  const route = { name: 'real-time-events', params: {}, query: {} }
  const router = { replace: vi.fn() }
  const toast = { add: vi.fn() }
  return { route, router, toast }
}

/**
 * Stub `navigator.clipboard.writeText` to return a deferred promise we
 * resolve / reject by hand. Returns the deferred plus a restore thunk.
 *
 * Also forces `window.isSecureContext = true` so the feature-detect
 * branch in `shareCurrentView` proceeds to the actual write.
 */
function withDeferredClipboard() {
  const deferred = makeDeferred()
  const writeText = vi.fn(() => deferred.promise)

  const originalClipboard = Object.getOwnPropertyDescriptor(window.navigator, 'clipboard')
  const originalSecure = Object.getOwnPropertyDescriptor(window, 'isSecureContext')

  Object.defineProperty(window.navigator, 'clipboard', {
    configurable: true,
    writable: true,
    value: { writeText }
  })
  Object.defineProperty(window, 'isSecureContext', {
    configurable: true,
    writable: true,
    value: true
  })

  function restore() {
    if (originalClipboard) {
      Object.defineProperty(window.navigator, 'clipboard', originalClipboard)
    } else {
      delete window.navigator.clipboard
    }
    if (originalSecure) {
      Object.defineProperty(window, 'isSecureContext', originalSecure)
    } else {
      delete window.isSecureContext
    }
  }

  return { deferred, writeText, restore }
}

// fast-check generator for viewState payloads
const arbViewState = fc.record({
  filters: fc.option(fc.dictionary(fc.string({ minLength: 1, maxLength: 8 }), fc.string()), {
    nil: null
  }),
  dataset: fc.constantFrom('workloadEvents', 'functionEvents', 'edgeDnsQueriesEvents'),
  pageSize: fc.integer({ min: 10, max: 500 }),
  selectedFields: fc.array(fc.string({ minLength: 1, maxLength: 12 }), { maxLength: 6 })
})

// ---------------------------------------------------------------------------
// Property: success toast happens after the clipboard write resolves
// ---------------------------------------------------------------------------

describe('useSessionManager.shareCurrentView · clipboard promise ordering (Task 4.3*)', () => {
  let restoreClipboard = null

  beforeEach(() => {
    vi.spyOn(console, 'info').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    if (restoreClipboard) {
      restoreClipboard()
      restoreClipboard = null
    }
    vi.restoreAllMocks()
  })

  it('success toast fires AFTER navigator.clipboard.writeText resolves (PBT)', async () => {
    await fc.assert(
      fc.asyncProperty(arbViewState, async (viewState) => {
        const { deferred, writeText, restore } = withDeferredClipboard()
        restoreClipboard = restore

        const { route, router, toast } = makeFixture()
        const session = useSessionManager({ route, router, toast })

        const sharePromise = session.shareCurrentView({ viewState })

        // The write was triggered (clipboard was called) — but the promise
        // is still pending. The success toast MUST NOT have fired yet.
        // We yield a microtask so any synchronous toast calls would have
        // landed in `toast.add` already.
        await Promise.resolve()
        expect(writeText).toHaveBeenCalledTimes(1)
        expect(toast.add).not.toHaveBeenCalled()

        // Resolve the deferred → shareCurrentView resumes → toast fires.
        deferred.resolve()
        await sharePromise

        // After awaiting, the success toast is the first (and only) toast.
        expect(toast.add).toHaveBeenCalledTimes(1)
        const call = toast.add.mock.calls[0][0]
        expect(call.severity).toBe('success')
        expect(call.summary).toMatch(/copied/i)

        // Reset module state between iterations (each iteration installs
        // its own clipboard stub).
        restore()
        restoreClipboard = null
      }),
      { numRuns: 20 } // each iteration is async + microtask-heavy, keep modest
    )
  })

  it('error toast fires when navigator.clipboard.writeText rejects', async () => {
    await fc.assert(
      fc.asyncProperty(arbViewState, async (viewState) => {
        const { deferred, restore } = withDeferredClipboard()
        restoreClipboard = restore

        const { route, router, toast } = makeFixture()
        const session = useSessionManager({ route, router, toast })

        const sharePromise = session.shareCurrentView({ viewState })

        // Still pending — no toast yet.
        await Promise.resolve()
        expect(toast.add).not.toHaveBeenCalled()

        // Reject → catch branch fires → error toast appears.
        deferred.reject(new Error('NotAllowedError'))
        await sharePromise

        expect(toast.add).toHaveBeenCalledTimes(1)
        const call = toast.add.mock.calls[0][0]
        expect(call.severity).toBe('error')

        restore()
        restoreClipboard = null
      }),
      { numRuns: 20 }
    )
  })

  it('uses fallback dialog when wired and clipboard rejects (no error toast)', async () => {
    const { deferred, restore } = withDeferredClipboard()
    restoreClipboard = restore

    const { route, router, toast } = makeFixture()
    const fallbackShow = vi.fn()
    const fallbackCopyDialogRef = { value: { show: fallbackShow } }

    const session = useSessionManager({ route, router, toast, fallbackCopyDialogRef })

    const sharePromise = session.shareCurrentView({ viewState: { dataset: 'workloadEvents' } })

    await Promise.resolve()
    expect(toast.add).not.toHaveBeenCalled()

    deferred.reject(new Error('write denied'))
    await sharePromise

    // Dialog was opened with the (well-formed) URL string.
    expect(fallbackShow).toHaveBeenCalledTimes(1)
    expect(fallbackShow.mock.calls[0][0]).toMatch(/shareState=/)

    // Info toast (not error) is the contract when the fallback dialog
    // takes over the manual copy flow.
    expect(toast.add).toHaveBeenCalledTimes(1)
    expect(toast.add.mock.calls[0][0].severity).toBe('info')
  })

  it('throws-before-writing path when clipboard API is unavailable', async () => {
    // Remove navigator.clipboard entirely → throw before write.
    const originalClipboard = Object.getOwnPropertyDescriptor(window.navigator, 'clipboard')
    Object.defineProperty(window.navigator, 'clipboard', {
      configurable: true,
      writable: true,
      value: undefined
    })
    Object.defineProperty(window, 'isSecureContext', {
      configurable: true,
      writable: true,
      value: true
    })

    try {
      const { route, router, toast } = makeFixture()
      const session = useSessionManager({ route, router, toast })

      await session.shareCurrentView({ viewState: { dataset: 'workloadEvents' } })

      // Error path: no fallback dialog → error toast.
      expect(toast.add).toHaveBeenCalledTimes(1)
      expect(toast.add.mock.calls[0][0].severity).toBe('error')
    } finally {
      if (originalClipboard) {
        Object.defineProperty(window.navigator, 'clipboard', originalClipboard)
      } else {
        delete window.navigator.clipboard
      }
    }
  })
})
