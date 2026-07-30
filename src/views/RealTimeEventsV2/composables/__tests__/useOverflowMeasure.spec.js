import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { defineComponent, h, KeepAlive, nextTick, ref } from 'vue'
import { mount } from '@vue/test-utils'
import { useOverflowMeasure } from '../useOverflowMeasure.js'
import { installResizeObserverCounter } from '../../__tests__/_helpers/measurement.js'

/**
 * Feature: real-time-events-v2-refactor — task 3.3 (`useOverflowMeasure`).
 *
 * Validates: Requirements 1.2, 1.5, 4.5 and **Property P1** — the table's
 * ResizeObserver count is O(1), NOT O(rows). The v1 `log-field-badges.vue`
 * created one observer per rendered Document-column row; this composable
 * collapses that to a single shared observer keyed by `row.id`, with symmetric
 * teardown across mount/unmount AND keep-alive activate/deactivate.
 *
 * The mandated `installResizeObserverCounter` helper counts LIVE observers (an
 * observer that has observed at least one node and not disconnected). We use it
 * to prove liveCount stays constant at N=100 vs N=10000 observed rows.
 *
 * `useOverflowMeasure` uses `useKeepAliveResource`, which needs component
 * lifecycle hooks — so tests mount a tiny harness rather than call the
 * composable bare.
 */

// --- test harness ----------------------------------------------------------

/**
 * Build a fake `.log-badges-container` whose overflow is fully controlled: a
 * container element with `hidden` child badges past its clipped bottom. jsdom
 * returns 0-rects by default, so we stub getBoundingClientRect on the container
 * and on each badge to model an explicit layout.
 *
 * @param {{ total: number, hidden: number }} layout
 * @returns {HTMLElement} the container element
 */
const makeContainer = ({ total, hidden }) => {
  const container = document.createElement('div')
  container.className = 'log-badges-container'
  // Container's clipped bottom sits at y=45 (the 2-row band).
  container.getBoundingClientRect = () => ({
    top: 0,
    bottom: 45,
    left: 0,
    right: 200,
    width: 200,
    height: 45
  })

  for (let index = 0; index < total; index += 1) {
    const badge = document.createElement('span')
    badge.className = 'log-badge'
    const overflowing = index >= total - hidden
    // Overflowing badges sit below the container bottom (y=100), visible ones above.
    const bottom = overflowing ? 100 : 20
    badge.getBoundingClientRect = () => ({
      top: bottom - 20,
      bottom,
      left: 0,
      right: 40,
      width: 40,
      height: 20
    })
    container.appendChild(badge)
  }
  return container
}

/**
 * Harness component that exposes the composable API on its vm and renders a
 * host div (used as `scrollParentRef`). `keys`/`rowLayouts` drive how many rows
 * are observed.
 */
const makeHarness = (apiSink) =>
  defineComponent({
    name: 'OverflowHarness',
    setup() {
      const scrollParentRef = ref(null)
      const api = useOverflowMeasure({ scrollParentRef })
      if (apiSink) apiSink(api)
      return { scrollParentRef }
    },
    render() {
      return h('div', { ref: 'scrollParentRef', class: 'viewport' }, 'viewport')
    }
  })

const makeKeepAliveHost = (child) =>
  defineComponent({
    setup() {
      const show = ref(true)
      return { show }
    },
    render() {
      return h(KeepAlive, {}, [this.show ? h(child) : null])
    }
  })

// Flush the RAF-batched measure (jsdom uses the microtask fallback path since
// requestAnimationFrame is stubbed to a real timer in the environment; wait a
// frame + microtask to be safe).
const flushMeasure = async () => {
  await new Promise((resolve) => setTimeout(resolve, 0))
  await nextTick()
}

let roCounter

beforeEach(() => {
  roCounter = installResizeObserverCounter()
  // Deterministic RAF: run the callback on a macrotask so flushMeasure catches it.
  vi.stubGlobal('requestAnimationFrame', (cb) => setTimeout(() => cb(performance.now?.() ?? 0), 0))
  vi.stubGlobal('cancelAnimationFrame', (id) => clearTimeout(id))
})

afterEach(() => {
  roCounter.restore()
  vi.unstubAllGlobals()
})

describe('useOverflowMeasure — single shared observer (Property P1)', () => {
  it('uses exactly ONE live ResizeObserver regardless of observed row count', async () => {
    let api
    mount(makeHarness((exposed) => (api = exposed)))
    await nextTick()

    // Observe 100 rows.
    for (let index = 0; index < 100; index += 1) {
      api.observeRow(`r${index}`, makeContainer({ total: 3, hidden: 0 }))
    }
    await flushMeasure()
    expect(api.observedCount()).toBe(100)
    const liveAt100 = roCounter.liveCount()

    // Observe 10000 rows on a fresh table.
    let api2
    mount(makeHarness((exposed) => (api2 = exposed)))
    await nextTick()
    for (let index = 0; index < 10000; index += 1) {
      api2.observeRow(`x${index}`, makeContainer({ total: 3, hidden: 0 }))
    }
    await flushMeasure()
    expect(api2.observedCount()).toBe(10000)

    // P1: live observer count is CONSTANT (one per table), not O(rows).
    expect(liveAt100).toBe(1)
    expect(roCounter.liveCount()).toBe(2) // one per mounted harness, still O(tables)
  })

  it('total observers created never exceeds one per table even as rows churn', async () => {
    let api
    mount(makeHarness((exposed) => (api = exposed)))
    await nextTick()
    roCounter.reset()

    // Churn: observe then recycle the same keys with new elements 500 times.
    for (let round = 0; round < 5; round += 1) {
      for (let index = 0; index < 100; index += 1) {
        api.observeRow(`r${index}`, makeContainer({ total: 2, hidden: 0 }))
      }
    }
    await flushMeasure()

    // Zero NEW observers were constructed by churn — the one from acquire persists.
    expect(roCounter.totalCreated()).toBe(0)
    expect(api.observedCount()).toBe(100)
  })
})

describe('useOverflowMeasure — hidden count measurement', () => {
  it('computes "+N more" from badges overflowing the container bottom', async () => {
    let api
    mount(makeHarness((exposed) => (api = exposed)))
    await nextTick()

    api.observeRow('a', makeContainer({ total: 8, hidden: 3 }))
    api.observeRow('b', makeContainer({ total: 5, hidden: 0 }))
    await flushMeasure()

    expect(api.hiddenCountFor('a')).toBe(3)
    expect(api.hiddenCountFor('b')).toBe(0)
    expect(api.hiddenCountFor('unknown')).toBe(0)
  })

  it('re-measures after an element swap for a recycled row (same key, new node)', async () => {
    let api
    mount(makeHarness((exposed) => (api = exposed)))
    await nextTick()

    api.observeRow('row', makeContainer({ total: 6, hidden: 2 }))
    await flushMeasure()
    expect(api.hiddenCountFor('row')).toBe(2)

    // Recycle the DOM node with a different overflow.
    api.observeRow('row', makeContainer({ total: 10, hidden: 5 }))
    await flushMeasure()
    expect(api.hiddenCountFor('row')).toBe(5)
  })

  it('measureAll recomputes every observed row synchronously', async () => {
    let api
    mount(makeHarness((exposed) => (api = exposed)))
    await nextTick()
    api.observeRow('a', makeContainer({ total: 4, hidden: 1 }))
    api.observeRow('b', makeContainer({ total: 4, hidden: 4 }))

    api.measureAll()
    // measureAll is synchronous — no flush needed.
    expect(api.hiddenCountFor('a')).toBe(1)
    expect(api.hiddenCountFor('b')).toBe(4)
  })
})

describe('useOverflowMeasure — unobserve drops the row', () => {
  it('unobserveRow removes the element and clears its count', async () => {
    let api
    mount(makeHarness((exposed) => (api = exposed)))
    await nextTick()
    api.observeRow('gone', makeContainer({ total: 5, hidden: 2 }))
    await flushMeasure()
    expect(api.hiddenCountFor('gone')).toBe(2)
    expect(api.observedCount()).toBe(1)

    api.unobserveRow('gone')
    expect(api.observedCount()).toBe(0)
    expect(api.hiddenCountFor('gone')).toBe(0)
  })

  it('observing null unregisters an existing row', async () => {
    let api
    mount(makeHarness((exposed) => (api = exposed)))
    await nextTick()
    api.observeRow('r', makeContainer({ total: 3, hidden: 1 }))
    expect(api.observedCount()).toBe(1)
    api.observeRow('r', null)
    expect(api.observedCount()).toBe(0)
  })

  it('ignores nullish keys', async () => {
    let api
    mount(makeHarness((exposed) => (api = exposed)))
    await nextTick()
    api.observeRow(null, makeContainer({ total: 3, hidden: 1 }))
    api.observeRow(undefined, makeContainer({ total: 3, hidden: 1 }))
    expect(api.observedCount()).toBe(0)
  })
})

describe('useOverflowMeasure — symmetric teardown (no leak)', () => {
  it('disconnects the observer on unmount', async () => {
    let api
    const wrapper = mount(makeHarness((exposed) => (api = exposed)))
    await nextTick()
    api.observeRow('a', makeContainer({ total: 3, hidden: 0 }))
    await flushMeasure()
    expect(roCounter.liveCount()).toBe(1)
    expect(api.isActive.value).toBe(true)

    wrapper.unmount()
    // Observer disconnected → no live observers remain.
    expect(roCounter.liveCount()).toBe(0)
    expect(api.isActive.value).toBe(false)
  })

  it('releases on keep-alive deactivate and re-acquires on activate (one observer, symmetric)', async () => {
    let api
    const wrapper = mount(makeKeepAliveHost(makeHarness((exposed) => (api = exposed))))
    await nextTick()
    api.observeRow('a', makeContainer({ total: 3, hidden: 0 }))
    await flushMeasure()
    expect(roCounter.liveCount()).toBe(1)

    // Deactivate (hide) → release: observer disconnected.
    wrapper.vm.show = false
    await nextTick()
    expect(roCounter.liveCount()).toBe(0)
    expect(api.isActive.value).toBe(false)

    // Reactivate (show) → re-acquire: exactly ONE observer again (not stacked).
    wrapper.vm.show = true
    await nextTick()
    await flushMeasure()
    expect(roCounter.liveCount()).toBe(1)
    expect(api.isActive.value).toBe(true)

    // Re-activation restored the watch set with the SAME single observer.
    expect(api.observedCount()).toBe(1)
  })

  it('does not stack observers across repeated activate/deactivate cycles', async () => {
    let api
    const wrapper = mount(makeKeepAliveHost(makeHarness((exposed) => (api = exposed))))
    await nextTick()
    api.observeRow('a', makeContainer({ total: 3, hidden: 0 }))

    for (let cycle = 0; cycle < 5; cycle += 1) {
      wrapper.vm.show = false
      await nextTick()
      wrapper.vm.show = true
      await nextTick()
    }
    await flushMeasure()

    // Still exactly one live observer after 5 cycles (symmetric acquire/release).
    expect(roCounter.liveCount()).toBe(1)
  })
})
