import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
/* global globalThis */
import { computed, nextTick } from 'vue'
import { mount } from '@vue/test-utils'

/**
 * Wave 0 — PRESERVE guard for task 7.4 (`useChartBrush` extraction).
 *
 * SEAM: chart brush → emitted date range.
 *
 * This suite characterizes the CURRENT observable contract of the brush on
 * `event-chart.vue`: dragging a horizontal selection across the chart (with a
 * mouse pointer) commits a `brush-select` event whose payload is a date range
 * mapped from pixel-percentage onto the `tsRangeBegin..tsRangeEnd` window.
 *
 * The contract we must preserve through the refactor:
 *   - event name: `brush-select`
 *   - payload shape: `{ begin: Date, end: Date }` (both real Date instances)
 *   - ordering: `begin < end` regardless of drag direction (left→right OR
 *     right→left), because the handler applies Math.min/Math.max on the pixel
 *     positions before mapping to time
 *   - bounds: begin/end stay within [tsRangeBegin, tsRangeEnd]
 *   - suppression: a drag narrower than 5% of chart width does NOT emit
 *   - suppression: no range props (tsRangeBegin/tsRangeEnd null) does NOT emit
 *
 * jsdom returns 0 for getBoundingClientRect()/offsetWidth, so we stub the
 * chart-canvas geometry after mount (the brush math reads rect.left, rect.width
 * and offsetWidth off `chartRef`, which is the `.chart-canvas` element).
 *
 * c3 + useChartBuilder are mocked exactly as the existing observer-lifecycle
 * suite does, so the chart-container branch (which holds the pointer handlers)
 * renders without touching the real charting lib.
 */

// ── c3 mock ──────────────────────────────────────────────────────────────
const c3Generate = vi.fn(() => ({
  resize: vi.fn(),
  destroy: vi.fn(),
  tooltip: { hide: vi.fn(), show: vi.fn() }
}))

vi.mock('c3', () => ({
  default: { generate: (...args) => c3Generate(...args) }
}))

// Force chartData.columns.length > 0 so the `.chart-container` (with the
// pointer handlers) renders instead of the empty/loading branch.
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

// jsdom lacks matchMedia; the chart's breakpoint composables call it on mount.
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

class NoopResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

let originalRO
let originalGlobalRO
let originalMatchMedia

beforeEach(() => {
  originalRO = window.ResizeObserver
  originalGlobalRO = globalThis.ResizeObserver
  originalMatchMedia = window.matchMedia
  window.ResizeObserver = NoopResizeObserver
  globalThis.ResizeObserver = NoopResizeObserver
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

// Settle initChart's setTimeout → nextTick → c3.generate chain.
const flush = async () => {
  for (let pass = 0; pass < 4; pass += 1) {
    await nextTick()
    vi.runAllTimers()
    await nextTick()
  }
}

// Representative window: 12h starting at t0 (all UTC — TZ=UTC required).
const T0 = '2026-07-01T00:00:00.000Z'
const T_END = '2026-07-01T12:00:00.000Z'
const T0_MS = new Date(T0).getTime()
const RANGE_MS = new Date(T_END).getTime() - T0_MS

// Chart canvas geometry we impose so the pixel→time math is deterministic.
const CHART_LEFT = 0
const CHART_WIDTH = 1000

let EventChart

const mountChart = (props = {}) =>
  mount(EventChart, {
    attachTo: document.body,
    props: {
      configKey: 'httpEvents',
      data: [{}],
      tsRangeBegin: T0,
      tsRangeEnd: T_END,
      ...props
    },
    global: {
      stubs: { Skeleton: true, InlineMessage: true },
      directives: { tooltip: {} }
    }
  })

// The brush math reads geometry off `chartRef` (the `.chart-canvas` node).
// jsdom reports zeros, so we impose a fixed rect + offsetWidth.
const stubCanvasGeometry = (wrapper) => {
  const canvas = wrapper.find('.chart-canvas').element
  canvas.getBoundingClientRect = () => ({
    left: CHART_LEFT,
    top: 0,
    right: CHART_LEFT + CHART_WIDTH,
    bottom: 300,
    width: CHART_WIDTH,
    height: 300,
    px: CHART_LEFT,
    py: 0,
    toJSON() {}
  })
  Object.defineProperty(canvas, 'offsetWidth', {
    configurable: true,
    value: CHART_WIDTH
  })
}

// jsdom does not implement PointerEvent; a plain Event with the pointer
// properties assigned drives the @pointer* listeners identically.
const pointerEvent = (type, { clientX, clientY }) => {
  const evt = new window.Event(type, { bubbles: true })
  Object.assign(evt, {
    clientX,
    clientY,
    pointerType: 'mouse',
    pointerId: 1
  })
  return evt
}

// Dispatch a full mouse drag: pointerdown at fromX, move to toX, pointerup.
// clientX values are viewport coords; localX = clientX - rect.left.
const mouseDrag = async (wrapper, fromX, toX) => {
  const container = wrapper.find('.chart-container').element
  container.dispatchEvent(pointerEvent('pointerdown', { clientX: fromX, clientY: 10 }))
  container.dispatchEvent(pointerEvent('pointermove', { clientX: toX, clientY: 10 }))
  container.dispatchEvent(pointerEvent('pointerup', { clientX: toX, clientY: 10 }))
  await nextTick()
}

const brushEvents = (wrapper) => wrapper.emitted('brush-select') || []
const lastBrush = (wrapper) => {
  const evts = brushEvents(wrapper)
  return evts.length ? evts[evts.length - 1][0] : null
}

describe('EventChart brush → brush-select (PRESERVE guard for useChartBrush extraction)', () => {
  beforeEach(async () => {
    EventChart = (await import('../event-chart.vue')).default
  })

  it('emits brush-select with a { begin: Date, end: Date } payload on a left→right drag', async () => {
    const wrapper = mountChart()
    await flush()
    stubCanvasGeometry(wrapper)

    // Drag 200px → 800px over a 1000px canvas ⇒ 20% → 80% of the window.
    await mouseDrag(wrapper, 200, 800)

    const payload = lastBrush(wrapper)
    expect(payload).not.toBeNull()
    expect(payload.begin).toBeInstanceOf(Date)
    expect(payload.end).toBeInstanceOf(Date)

    // Pixel-percentage mapped onto the [T0, T_END] window.
    expect(payload.begin.getTime()).toBe(T0_MS + 0.2 * RANGE_MS)
    expect(payload.end.getTime()).toBe(T0_MS + 0.8 * RANGE_MS)

    // Exactly one commit — the drag must not double-emit. Guards the
    // useChartBrush extraction (task 7.4) against firing on both pointermove
    // and pointerup (which would trigger a duplicate date-filter reload).
    expect(brushEvents(wrapper)).toHaveLength(1)

    wrapper.unmount()
  })

  it('produces begin < end and stays within [tsRangeBegin, tsRangeEnd]', async () => {
    const wrapper = mountChart()
    await flush()
    stubCanvasGeometry(wrapper)

    await mouseDrag(wrapper, 150, 700)

    const { begin, end } = lastBrush(wrapper)
    expect(begin.getTime()).toBeLessThan(end.getTime())
    expect(begin.getTime()).toBeGreaterThanOrEqual(T0_MS)
    expect(end.getTime()).toBeLessThanOrEqual(T0_MS + RANGE_MS)

    wrapper.unmount()
  })

  it('normalizes a right→left drag to the same ordered range (begin < end)', async () => {
    const wrapper = mountChart()
    await flush()
    stubCanvasGeometry(wrapper)

    // Same span as the left→right case but dragged backwards (800 → 200).
    await mouseDrag(wrapper, 800, 200)

    const { begin, end } = lastBrush(wrapper)
    expect(begin.getTime()).toBeLessThan(end.getTime())
    // Math.min/Math.max on pixels ⇒ identical mapped range to the forward drag.
    expect(begin.getTime()).toBe(T0_MS + 0.2 * RANGE_MS)
    expect(end.getTime()).toBe(T0_MS + 0.8 * RANGE_MS)

    wrapper.unmount()
  })

  it('does NOT emit when the drag is narrower than the 5% minimum width', async () => {
    const wrapper = mountChart()
    await flush()
    stubCanvasGeometry(wrapper)

    // 30px over 1000px = 3% < BRUSH_MIN_WIDTH_RATIO (0.05).
    await mouseDrag(wrapper, 500, 530)

    expect(brushEvents(wrapper)).toHaveLength(0)

    wrapper.unmount()
  })

  it('emits for a drag just above the 5% minimum width (~6%)', async () => {
    const wrapper = mountChart()
    await flush()
    stubCanvasGeometry(wrapper)

    // 60px over 1000px = 6% > BRUSH_MIN_WIDTH_RATIO (0.05). Together with the
    // 3%-suppressed case above this straddles the 5% boundary, so a change to
    // the ratio (raise or lower) is caught on one side or the other.
    await mouseDrag(wrapper, 470, 530)

    expect(brushEvents(wrapper)).toHaveLength(1)
    const { begin, end } = lastBrush(wrapper)
    expect(begin.getTime()).toBeLessThan(end.getTime())

    wrapper.unmount()
  })

  it('does NOT emit when the time-range props are absent', async () => {
    const wrapper = mountChart({ tsRangeBegin: null, tsRangeEnd: null })
    await flush()
    stubCanvasGeometry(wrapper)

    // A wide, valid-width drag — suppressed only because there is no window.
    await mouseDrag(wrapper, 200, 800)

    expect(brushEvents(wrapper)).toHaveLength(0)

    wrapper.unmount()
  })
})
