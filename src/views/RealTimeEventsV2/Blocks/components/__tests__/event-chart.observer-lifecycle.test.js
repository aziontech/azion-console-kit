import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
/* global globalThis */
import { computed, defineComponent, h, KeepAlive, nextTick, ref } from 'vue'
import { mount } from '@vue/test-utils'

/**
 * Task 5.6 — Property P1: observer-count invariant for EventChart.
 *
 * The chart wires its ResizeObserver + viewport listeners through
 * `useKeepAliveResource`, which owns the acquire/release symmetry across
 * mount / keep-alive activate / keep-alive deactivate / unmount. This suite is
 * an INTEGRATION test: it mounts the real `event-chart.vue` under `<KeepAlive>`
 * with a counting ResizeObserver mock and asserts:
 *
 *  1. At most ONE live ResizeObserver exists for the chart at any moment.
 *  2. The live-observer count returns to its mount-time baseline after
 *     deactivate and after unmount (no leak across keep-alive cycles).
 *  3. Re-activation refits the chart (c3 rebuild runs again, because the
 *     instance is torn down on deactivate) — the chart is not left stale.
 *
 * A companion assertion covers `log-field-badges.vue`: as of Fase 1 (task 3.6)
 * it is purely presentational and owns NO ResizeObserver — overflow measurement
 * moved to the single per-table observer in `useOverflowMeasure` (task 3.3). The
 * companion test now pins that zero-observer contract (the P1 O(rows) leak fix).
 *
 * c3 is mocked so the test never touches the real charting lib; `generate`
 * returns a spy instance whose calls we count as the "refit" signal.
 */

// ── c3 mock ──────────────────────────────────────────────────────────────
// Each generate() returns a fresh instance with spy resize/destroy so we can
// assert refit (a fresh generate) after re-activation.
const c3Generate = vi.fn(() => ({
  resize: vi.fn(),
  destroy: vi.fn(),
  tooltip: { hide: vi.fn() }
}))

vi.mock('c3', () => ({
  default: { generate: (...args) => c3Generate(...args) }
}))

// Mock useChartBuilder so chartData always has columns (the chart-container
// branch — which holds chartContainerRef/chartRef — is gated on
// `chartData.columns.length`). buildC3Config is forced truthy so initChart
// reaches c3.generate. The full return shape the component destructures is
// preserved (chartConfig, chartData, totalEvents, formattedTotal, chartKind,
// labelWidthCache, resetTickCache).
vi.mock('../../../composables/useChartBuilder', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useChartBuilder: () => ({
      chartConfig: computed(() => ({ chartType: 'bar', dataUnit: 'count' })),
      chartData: computed(() => ({
        columns: [
          ['x', '00:00', '00:01'],
          ['count', 10, 20]
        ],
        groups: [['count']],
        seriesNames: ['count'],
        maxValue: 20,
        tooltipLabels: ['00:00', '00:01']
      })),
      totalEvents: computed(() => 30),
      formattedTotal: computed(() => '30'),
      chartKind: computed(() => 'single_series_histogram'),
      labelWidthCache: new Map(),
      resetTickCache: vi.fn()
    }),
    buildC3Config: () => ({ data: {} })
  }
})

// ── Counting ResizeObserver mock ───────────────────────────────────────────
// Tracks live observers = constructed − disconnected. `liveCount()` is the
// invariant probe used throughout.
let liveObservers
let peakLive

class CountingResizeObserver {
  constructor(cb) {
    this.cb = cb
    liveObservers.add(this)
    if (liveObservers.size > peakLive) peakLive = liveObservers.size
  }
  observe() {}
  unobserve() {}
  disconnect() {
    liveObservers.delete(this)
  }
}

const liveCount = () => liveObservers.size

let originalRO
let originalGlobalRO
let originalMatchMedia

// jsdom does not implement matchMedia; the chart's breakpoint composables
// (useBreakpoint / useReactiveMediaQuery) call it on mount.
const matchMediaStub = (query) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener() {},
  removeListener() {},
  addEventListener() {},
  removeEventListener() {},
  dispatchEvent() {
    return false
  }
})

beforeEach(() => {
  liveObservers = new Set()
  peakLive = 0
  originalRO = window.ResizeObserver
  originalGlobalRO = globalThis.ResizeObserver
  originalMatchMedia = window.matchMedia
  window.ResizeObserver = CountingResizeObserver
  globalThis.ResizeObserver = CountingResizeObserver
  window.matchMedia = matchMediaStub
  c3Generate.mockClear()
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
  window.ResizeObserver = originalRO
  globalThis.ResizeObserver = originalGlobalRO
  window.matchMedia = originalMatchMedia
  vi.restoreAllMocks()
})

// Flush the chart's init/resize timers (setTimeout 50/80) + rAF + microtasks.
// initChart chains: setTimeout(50) → nextTick → c3.generate, so we interleave
// timer + microtask flushes a few times to settle the whole chain.
const flush = async () => {
  for (let pass = 0; pass < 4; pass += 1) {
    await nextTick()
    vi.runAllTimers()
    await nextTick()
  }
}

// Host wraps a child in <KeepAlive>, toggling `show` to drive
// activate/deactivate without a full unmount (same pattern as the composable
// unit test).
const makeHost = (child, childProps = {}) =>
  defineComponent({
    setup() {
      const show = ref(true)
      return { show }
    },
    render() {
      return h(KeepAlive, {}, [this.show ? h(child, childProps) : null])
    }
  })

describe('EventChart — ResizeObserver lifecycle invariant (P1)', () => {
  let EventChart

  beforeEach(async () => {
    EventChart = (await import('../event-chart.vue')).default
  })

  const mountChart = () =>
    mount(makeHost(EventChart, { configKey: 'httpEvents', data: [] }), {
      attachTo: document.body,
      global: {
        stubs: {
          Skeleton: true,
          InlineMessage: true
        },
        directives: { tooltip: {} }
      }
    })

  it('keeps at most one live observer and returns to baseline across mount → deactivate → activate → unmount', async () => {
    const wrapper = mountChart()
    await flush()

    // Baseline after mount: exactly one live observer acquired.
    const baseline = liveCount()
    expect(baseline).toBe(1)
    expect(peakLive).toBeLessThanOrEqual(1)

    // Deactivate → release: observer disconnected, back below/equal baseline.
    wrapper.vm.show = false
    await flush()
    expect(liveCount()).toBe(0)

    // Re-activate → re-acquire: exactly one again, never two.
    wrapper.vm.show = true
    await flush()
    expect(liveCount()).toBe(1)
    expect(peakLive).toBeLessThanOrEqual(1)

    // Second deactivate/activate cycle — still no accumulation.
    wrapper.vm.show = false
    await flush()
    expect(liveCount()).toBe(0)
    wrapper.vm.show = true
    await flush()
    expect(liveCount()).toBe(1)
    expect(peakLive).toBeLessThanOrEqual(1)

    // Unmount → release: returns to zero (no leak).
    wrapper.unmount()
    await flush()
    expect(liveCount()).toBe(0)
  })

  it('refits the chart after re-activation (fresh c3 build runs)', async () => {
    const wrapper = mountChart()
    await flush()

    // Initial mount built the chart once.
    expect(c3Generate).toHaveBeenCalledTimes(1)

    // Deactivate tears down the c3 instance (chartInstance → null).
    wrapper.vm.show = false
    await flush()

    // Re-activation: onActivated sees no live instance and rebuilds → refit.
    c3Generate.mockClear()
    wrapper.vm.show = true
    await flush()
    expect(c3Generate).toHaveBeenCalledTimes(1)

    wrapper.unmount()
  })
})

describe('LogFieldBadges — owns no ResizeObserver (P1 O(rows) leak fix)', () => {
  let LogFieldBadges

  beforeEach(async () => {
    LogFieldBadges = (await import('../log-field-badges.vue')).default
  })

  const mountBadges = () =>
    mount(
      makeHost(LogFieldBadges, {
        summary: [
          { key: 'host', value: 'example.com' },
          { key: 'status', value: 200 }
        ]
      }),
      {
        attachTo: document.body,
        global: {
          directives: { tooltip: {} }
        }
      }
    )

  it('constructs zero observers across mount / deactivate / reactivate / unmount', async () => {
    // Task 3.6: overflow measurement moved out of the per-row component into the
    // single per-table observer (useOverflowMeasure, task 3.3). The badges
    // component must therefore never create a ResizeObserver of its own — that is
    // the fix for the O(rows) observer leak. peakLive stays 0 across the full
    // keep-alive lifecycle.
    const wrapper = mountBadges()
    await flush()
    expect(liveCount()).toBe(0)
    expect(peakLive).toBe(0)

    wrapper.vm.show = false
    await flush()
    expect(liveCount()).toBe(0)

    wrapper.vm.show = true
    await flush()
    expect(liveCount()).toBe(0)
    expect(peakLive).toBe(0)

    wrapper.unmount()
    await flush()
    expect(liveCount()).toBe(0)
  })

  it('renders the "+N more" badge from the hiddenCount prop (measurement is external)', async () => {
    const wrapper = mount(
      makeHost(LogFieldBadges, {
        summary: [{ key: 'host', value: 'example.com' }],
        hiddenCount: 4
      }),
      {
        attachTo: document.body,
        global: { directives: { tooltip: {} } }
      }
    )
    await flush()
    expect(wrapper.find('.log-badge--more').text()).toBe('+4 more')
    wrapper.unmount()
  })
})
