/* global globalThis */
import { vi } from 'vitest'

/**
 * Task 1.3 — Real-measurement test infrastructure (helpers only).
 *
 * DRY building blocks shared by the Property tests landing in later waves:
 *
 *  - P1 (observer-count invariant): `installResizeObserverCounter()` — a
 *    counting ResizeObserver global whose LIVE instance count must be equal at
 *    N=100 vs N=10000 rows (constant, not O(rows)).
 *  - P2 (bounded DOM): `countMountedRows()` / `countDomNodes()` — measure the
 *    rendered surface so a virtualized/windowed table can be proven to keep the
 *    node/row count bounded regardless of dataset size.
 *  - P4 (no redundant fetches): `makeServiceCallSpy()` — wraps a service fn and
 *    counts invocations so a test can assert <= 1 events-list + <= 1 metrics
 *    fetch per user action.
 *
 * These helpers deliberately DO NOT assert anything themselves and touch NO
 * production code — they are pure test infrastructure. Conventions mirror the
 * existing counting-RO mock in
 * `Blocks/components/__tests__/event-chart.observer-lifecycle.test.js`.
 */

/**
 * @typedef {Object} ResizeObserverCounter
 * @property {() => number} liveCount   Current live observers (observed − disconnected).
 * @property {() => number} peakCount   Max simultaneous live observers seen since last reset.
 * @property {() => number} totalCreated Total constructors invoked since last reset.
 * @property {() => void}   reset        Clears counters WITHOUT restoring the global.
 * @property {() => void}   restore      Restores the previous window/globalThis ResizeObserver.
 */

/**
 * Install a global `ResizeObserver` mock that tracks LIVE instances.
 *
 * An instance is considered "live" once it has called `observe()` at least
 * once and has not yet called `disconnect()`. This mirrors how a leak would
 * manifest: an observer that observed a node but was never disconnected on
 * teardown keeps the observed element (and its component) reachable.
 *
 * `unobserve()` on the last observed target also drops the instance from the
 * live set (an observer watching nothing is effectively inert), matching real
 * ResizeObserver semantics closely enough for count invariants.
 *
 * Both `window.ResizeObserver` and `globalThis.ResizeObserver` are replaced so
 * components that reference either resolve to the counter. Call `restore()` in
 * `afterEach` to put the originals back.
 *
 * @returns {ResizeObserverCounter}
 */
export function installResizeObserverCounter() {
  const live = new Set()
  let peak = 0
  let totalCreated = 0

  const track = (instance) => {
    if (live.has(instance)) return
    live.add(instance)
    if (live.size > peak) peak = live.size
  }

  class CountingResizeObserver {
    constructor(callback) {
      this.callback = callback
      this._targets = new Set()
      totalCreated += 1
    }

    observe(target) {
      if (target) this._targets.add(target)
      track(this)
    }

    unobserve(target) {
      this._targets.delete(target)
      // An observer watching nothing is no longer live.
      if (this._targets.size === 0) live.delete(this)
    }

    disconnect() {
      this._targets.clear()
      live.delete(this)
    }
  }

  const hasWindow = typeof window !== 'undefined'
  const prevWindowRO = hasWindow ? window.ResizeObserver : undefined
  const prevGlobalRO = globalThis.ResizeObserver

  if (hasWindow) window.ResizeObserver = CountingResizeObserver
  globalThis.ResizeObserver = CountingResizeObserver

  return {
    liveCount: () => live.size,
    peakCount: () => peak,
    totalCreated: () => totalCreated,
    reset: () => {
      live.clear()
      peak = 0
      totalCreated = 0
    },
    restore: () => {
      if (hasWindow) window.ResizeObserver = prevWindowRO
      globalThis.ResizeObserver = prevGlobalRO
    }
  }
}

/**
 * Resolve a queryable root from a `@vue/test-utils` wrapper, a raw DOM Element,
 * or a document-like object. Returns `null` when nothing queryable is found.
 *
 * @param {import('@vue/test-utils').VueWrapper | Element | Document | { element?: Element }} target
 * @returns {ParentNode | null}
 */
function resolveQueryRoot(target) {
  if (!target) return null
  // @vue/test-utils wrapper exposes `.element`.
  if (typeof target.element !== 'undefined' && target.element) return target.element
  // Raw Element / Document already support querySelectorAll.
  if (typeof target.querySelectorAll === 'function') return target
  return null
}

/**
 * Count rendered table rows via the stable `data-testid="table-body-row"`
 * contract used by the RealTimeEventsV2 data table (see
 * `Blocks/components/VirtualEventTable.vue`). This is the P2 probe: for a
 * windowed/virtualized table the mounted row count is bounded and does not grow
 * linearly with the dataset size. (See `Blocks/components/VirtualEventTable.vue`.)
 *
 * @param {import('@vue/test-utils').VueWrapper | Element} wrapper
 * @returns {number} number of rows currently in the DOM
 */
export function countMountedRows(wrapper) {
  const root = resolveQueryRoot(wrapper)
  if (!root) return 0
  return root.querySelectorAll('[data-testid="table-body-row"]').length
}

/**
 * Count total element nodes under a wrapper/element. Basis of P2: the total DOM
 * surface a component renders should stay bounded as the dataset grows.
 *
 * The count is inclusive of the root element itself when a raw Element is
 * passed, matching the intuitive "how many elements did this render" question.
 *
 * @param {import('@vue/test-utils').VueWrapper | Element} target
 * @returns {number} total number of element nodes
 */
export function countDomNodes(target) {
  const root = resolveQueryRoot(target)
  if (!root) return 0
  const descendants = root.querySelectorAll('*').length
  // Include the root element itself when it is a real Element (not a Document).
  const includeSelf = typeof root.nodeType === 'number' && root.nodeType === 1 ? 1 : 0
  return descendants + includeSelf
}

/**
 * @typedef {Object} ServiceCallSpy
 * @property {(...args: any[]) => any} spy       Drop-in replacement for the wrapped fn.
 * @property {() => number}            callCount Number of invocations since last reset.
 * @property {() => any[][]}           calls     Recorded argument lists per call.
 * @property {() => void}              reset     Zero the counter and clear recorded calls.
 */

/**
 * Wrap a service function so tests can count invocations. Used by P4 to assert
 * that a single user action triggers at most one events-list fetch and at most
 * one metrics fetch (no redundant/duplicate requests).
 *
 * The wrapped `spy` forwards arguments and return value (including promises) to
 * the original `impl`, so it works both for real service functions and for
 * `vi.fn()`-backed stubs. When no `impl` is supplied the spy is a no-op that
 * returns `undefined` — useful when only the call count matters.
 *
 * @param {(...args: any[]) => any} [impl] optional implementation to delegate to
 * @returns {ServiceCallSpy}
 */
export function makeServiceCallSpy(impl) {
  let count = 0
  const recordedCalls = []

  const spy = vi.fn((...args) => {
    count += 1
    recordedCalls.push(args)
    return typeof impl === 'function' ? impl(...args) : undefined
  })

  return {
    spy,
    callCount: () => count,
    calls: () => recordedCalls.map((args) => [...args]),
    reset: () => {
      count = 0
      recordedCalls.length = 0
      spy.mockClear()
    }
  }
}
