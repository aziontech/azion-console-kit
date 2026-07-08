import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'

import { buildC3Config, useChartBuilder } from '../useChartBuilder'
import { CHART_KINDS } from '../chart-kinds'

/**
 * Unit tests for the tick decimation + label-width cache added in Task 3.2 of
 * the `real-time-events-responsividade` spec.
 *
 * `computeTickPatch` is module-internal; we exercise it indirectly through
 * `buildC3Config`, which is the only public entry that touches it. The same
 * code path also runs on real charts, so the assertions stay representative of
 * production behaviour.
 */

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const AXIS_FONT_SIZE_PX = 11

// A fake DOM ref for `bindto`. `buildC3Config` does not introspect it.
const FAKE_CHART_REF = { tagName: 'DIV' }

// Minimal chart config; the decimation path does not depend on chartType or
// dataUnit specifics.
const FAKE_CHART_CONFIG = { chartType: 'bar' }

/**
 * Build a `chartData` payload with the given X labels and a single dummy
 * series, matching the shape `buildC3Config` expects.
 */
const buildChartData = (xLabels) => {
  const series = new Array(xLabels.length).fill(1)
  return {
    columns: [
      ['x', ...xLabels],
      ['count', ...series]
    ],
    groups: [['count']],
    seriesNames: ['count'],
    maxValue: 1,
    tooltipLabels: xLabels
  }
}

/**
 * Generate `count` HH:mm labels at 1-minute granularity starting from 00:00.
 * The shape produces a format key of `##:##` after `deriveFormatKey`.
 */
const buildHourMinuteLabels = (count) => {
  const labels = []
  for (let idx = 0; idx < count; idx += 1) {
    const hour = String(Math.floor(idx / 60) % 24).padStart(2, '0')
    const minute = String(idx % 60).padStart(2, '0')
    labels.push(`${hour}:${minute}`)
  }
  return labels
}

/**
 * Generate `count` `MM/dd HH:mm` labels — shape collapses to
 * `##/## ##:##` under `deriveFormatKey`, distinct from `##:##`.
 */
const buildMonthDayHourMinuteLabels = (count) => {
  const labels = []
  for (let idx = 0; idx < count; idx += 1) {
    const month = String((idx % 12) + 1).padStart(2, '0')
    const day = String(((idx + 1) % 28) + 1).padStart(2, '0')
    const hour = String(idx % 24).padStart(2, '0')
    const minute = String((idx * 5) % 60).padStart(2, '0')
    labels.push(`${month}/${day} ${hour}:${minute}`)
  }
  return labels
}

/**
 * Build a `chartContainer` stub that reports a fixed width. The implementation
 * checks `typeof chartContainer.getBoundingClientRect === 'function'` so a
 * plain object with that method is accepted.
 */
const buildChartContainer = (width) => ({
  getBoundingClientRect: () => ({ width, height: 200, top: 0, left: 0, right: width, bottom: 200 })
})

/**
 * Spy `Element.prototype.getBoundingClientRect` to return a fixed label width
 * for the off-screen `<span>` created by `measureLongestLabelWidth`. Returns
 * the spy so individual tests can assert call counts.
 *
 * The implementation derives `maxTicks = floor(containerWidth / (labelWidth +
 * LABEL_GAP_PX))`. Picking labelWidth=40 and gap=8 ⇒ slotWidth=48, which gives
 * intuitive numbers for the capacity assertions.
 */
const stubLabelMeasurement = (labelWidthPx = 40) => {
  return vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({
    width: labelWidthPx,
    height: 16,
    top: 0,
    left: 0,
    right: labelWidthPx,
    bottom: 16
  })
}

/**
 * Invokes `useChartBuilder` inside a real Vue component so its `setup`-scoped
 * state (the labelWidthCache Map and resetTickCache function) is initialised
 * exactly as it would be in production.
 */
const mountChartBuilder = (props = {}) => {
  let api
  const Component = defineComponent({
    setup() {
      api = useChartBuilder(props)
      return () => h('div')
    }
  })
  const wrapper = mount(Component)
  return {
    wrapper,
    get api() {
      return api
    }
  }
}

/**
 * JSDOM does not implement `window.matchMedia`, which `useBreakpoint` (called
 * indirectly by `useChartBuilder`) invokes from `onMounted`. Install a stub
 * that resolves all media queries to `false` — irrelevant to these tests,
 * which exercise `buildC3Config` via an explicit `breakpoint` arg.
 */
const installMatchMediaStub = () => {
  const stub = vi.fn((query) => ({
    matches: false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn()
  }))
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: stub
  })
  return stub
}

/* ------------------------------------------------------------------ */
/* Setup / Teardown                                                    */
/* ------------------------------------------------------------------ */

let rectSpy
let fakeAxisProbe

beforeEach(() => {
  installMatchMediaStub()
  // Default spy: every test that doesn't override gets a 40px label width.
  rectSpy = stubLabelMeasurement(40)
  // Inject a fake `.c3-axis-x text` element so `axisProbe` is non-null in the
  // decimation path. With a real probe present, the cache stores the measured
  // width; without one the cache skips storage to allow re-measurement after
  // C3 paints the real axis. The tests in this file exercise the cached path
  // explicitly, so we provide a probe.
  fakeAxisProbe = document.createElement('div')
  fakeAxisProbe.className = 'c3-axis-x'
  const textNode = document.createElement('span')
  fakeAxisProbe.appendChild(textNode)
  // querySelector('.c3-axis-x text') needs a real `text` element. JSDOM treats
  // 'text' as a tag selector — the span child above won't match. Use a custom
  // querySelector stub instead.
  vi.spyOn(document, 'querySelector').mockImplementation((selector) => {
    if (selector === '.c3-axis-x text') return textNode
    return null
  })
})

afterEach(() => {
  vi.restoreAllMocks()
  // Defensive: ensure no measurement span leaked into the DOM.
  const orphans = document.body.querySelectorAll('span[style*="visibility: hidden"]')
  orphans.forEach((node) => node.remove())
})

/* ------------------------------------------------------------------ */
/* A) Decimation                                                       */
/* ------------------------------------------------------------------ */

describe('useChartBuilder — tick decimation', () => {
  it('reduces 10 ticks to fit a 2-slot container, preserving first and last (indices)', () => {
    // longestLabelWidth = max(charEstimate ≈ 43px for "HH:mm", measurement=40)
    //   = 43; slotWidth = 43 * 1.4 + 16 = 76.2; container 192 ⇒
    //   maxTicks = floor(192/76.2) = 2.
    // tick.values now holds INDICES (numbers), not the raw label strings.
    const labels = buildHourMinuteLabels(10)
    const chartContainer = buildChartContainer(192)

    const config = buildC3Config({
      chartRef: FAKE_CHART_REF,
      chartData: buildChartData(labels),
      chartConfig: FAKE_CHART_CONFIG,
      chartKind: CHART_KINDS.SINGLE_SERIES_HISTOGRAM,
      chartContainer,
      breakpoint: 'desktop',
      labelWidthCache: new Map()
    })

    const xTick = config.axis.x.tick
    expect(Array.isArray(xTick.values)).toBe(true)
    expect(xTick.values).toHaveLength(2)
    // With preserveFirst+preserveLast on a 10-item array, the indices are
    // [0, 9].
    expect(xTick.values[0]).toBe(0)
    expect(xTick.values[xTick.values.length - 1]).toBe(labels.length - 1)
    // Explicit values disable legacy culling fallback.
    expect(xTick.culling).toBeUndefined()
    expect(xTick.fit).toBe(false)
  })

  it('keeps all 5 ticks when the container can fit 6', () => {
    // container 480, slotWidth ≈ 76 ⇒ maxTicks = floor(480/76) = 6 → no decimation
    const labels = buildHourMinuteLabels(5)
    const chartContainer = buildChartContainer(480)

    const config = buildC3Config({
      chartRef: FAKE_CHART_REF,
      chartData: buildChartData(labels),
      chartConfig: FAKE_CHART_CONFIG,
      chartKind: CHART_KINDS.SINGLE_SERIES_HISTOGRAM,
      chartContainer,
      breakpoint: 'desktop',
      labelWidthCache: new Map()
    })

    const xTick = config.axis.x.tick
    // No `values` patch ⇒ legacy culling fallback applies.
    expect(xTick.values).toBeUndefined()
    expect(xTick.culling).toBeDefined()
    expect(xTick.culling.max).toBeGreaterThan(0)
  })

  it('applies no decimation when there are zero natural ticks', () => {
    // Edge case: empty x column (a single-element ['x'] array). buildC3Config
    // bails out earlier (`!chartData.columns.length`), so feed it a payload
    // with one row but no labels to reach computeTickPatch with [].
    //
    // Easiest path: column[0] = ['x'] (length 1) ⇒ slice(1) = [].
    const config = buildC3Config({
      chartRef: FAKE_CHART_REF,
      chartData: {
        columns: [['x'], ['count']],
        groups: [['count']],
        seriesNames: ['count'],
        maxValue: 0,
        tooltipLabels: []
      },
      chartConfig: FAKE_CHART_CONFIG,
      chartKind: CHART_KINDS.SINGLE_SERIES_HISTOGRAM,
      chartContainer: buildChartContainer(400),
      breakpoint: 'desktop',
      labelWidthCache: new Map()
    })

    const xTick = config.axis.x.tick
    expect(xTick.values).toBeUndefined()
    // computeTickPatch returns {} for empty ticks → fallback culling applies.
    expect(xTick.culling).toBeDefined()
    // No measurement performed when there are no ticks.
    expect(rectSpy).not.toHaveBeenCalled()
  })

  it('falls back to culling when container width is 0', () => {
    const labels = buildHourMinuteLabels(10)
    // Container reports width 0 — covers the `containerWidth <= 0` branch
    // before window.innerWidth fallback kicks in.
    const chartContainer = buildChartContainer(0)

    // Force window.innerWidth to 0 so the fallback `containerWidth = window.innerWidth`
    // also yields 0 — otherwise JSDOM defaults (1024) would mask the branch.
    const originalInnerWidth = window.innerWidth
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      writable: true,
      value: 0
    })

    try {
      const config = buildC3Config({
        chartRef: FAKE_CHART_REF,
        chartData: buildChartData(labels),
        chartConfig: FAKE_CHART_CONFIG,
        chartKind: CHART_KINDS.SINGLE_SERIES_HISTOGRAM,
        chartContainer,
        breakpoint: 'desktop',
        labelWidthCache: new Map()
      })

      const xTick = config.axis.x.tick
      expect(xTick.values).toBeUndefined()
      expect(xTick.culling).toBeDefined()
      // No measurement is performed in the width-unavailable branch.
      expect(rectSpy).not.toHaveBeenCalled()
    } finally {
      Object.defineProperty(window, 'innerWidth', {
        configurable: true,
        writable: true,
        value: originalInnerWidth
      })
    }
  })

  it('uses a character-count estimate when measurement reports zero width (jsdom path)', () => {
    // Restore the global rectSpy so getBoundingClientRect returns the JSDOM
    // default ({ width: 0 }). The implementation must degrade gracefully —
    // not by falling back to culling, but by deriving a conservative width
    // from the longest label's character count.
    rectSpy.mockRestore()

    const labels = buildHourMinuteLabels(10) // "HH:mm" → 5 chars
    const chartContainer = buildChartContainer(400)

    const config = buildC3Config({
      chartRef: FAKE_CHART_REF,
      chartData: buildChartData(labels),
      chartConfig: FAKE_CHART_CONFIG,
      chartKind: CHART_KINDS.SINGLE_SERIES_HISTOGRAM,
      chartContainer,
      breakpoint: 'desktop',
      labelWidthCache: new Map()
    })

    // Estimated width ≈ 5 chars × 11px × 0.7 + 4 ≈ 42.5 → ceil 43px.
    // slotWidth = 43 × 1.4 + 16 = 76.2; container 400 ⇒ maxTicks = 5.
    // 10 natural ticks decimated to 5 (estimate-driven, not culling).
    const xTick = config.axis.x.tick
    expect(Array.isArray(xTick.values)).toBe(true)
    expect(xTick.values).toHaveLength(5)
    expect(xTick.culling).toBeUndefined()
  })
})

/* ------------------------------------------------------------------ */
/* B) Cache hit / miss                                                 */
/* ------------------------------------------------------------------ */

describe('useChartBuilder — labelWidthCache', () => {
  const baseArgs = (chartData, cache, breakpoint = 'desktop') => ({
    chartRef: FAKE_CHART_REF,
    chartData,
    chartConfig: FAKE_CHART_CONFIG,
    chartKind: CHART_KINDS.SINGLE_SERIES_HISTOGRAM,
    chartContainer: buildChartContainer(192),
    breakpoint,
    labelWidthCache: cache
  })

  it('caches measurements per (formatKey, fontSizePx): second call with the same labels is a hit', () => {
    const cache = new Map()
    const labels = buildHourMinuteLabels(10)
    const chartData = buildChartData(labels)

    buildC3Config(baseArgs(chartData, cache))
    expect(rectSpy).toHaveBeenCalledTimes(1)

    buildC3Config(baseArgs(chartData, cache))
    // Second call resolves from the cache — no further measurement.
    expect(rectSpy).toHaveBeenCalledTimes(1)
    // Cache contains exactly one entry keyed by `${formatKey}|${fontSize}`.
    expect(cache.size).toBe(1)
    const [[key]] = cache.entries()
    expect(key).toBe(`##:##|${AXIS_FONT_SIZE_PX}`)
  })

  it('misses the cache for a different format key (HH:mm vs MM/dd HH:mm)', () => {
    const cache = new Map()

    const hourMinute = buildChartData(buildHourMinuteLabels(10))
    const longer = buildChartData(buildMonthDayHourMinuteLabels(10))

    buildC3Config(baseArgs(hourMinute, cache))
    expect(rectSpy).toHaveBeenCalledTimes(1)

    buildC3Config(baseArgs(longer, cache))
    // Distinct formatKey ⇒ a new measurement is required.
    expect(rectSpy).toHaveBeenCalledTimes(2)
    expect(cache.size).toBe(2)

    const keys = Array.from(cache.keys()).sort()
    expect(keys).toEqual([`##:##|${AXIS_FONT_SIZE_PX}`, `##/## ##:##|${AXIS_FONT_SIZE_PX}`].sort())
  })

  it('resetTickCache() clears the cache so subsequent calls miss again', () => {
    const { wrapper, api } = mountChartBuilder({
      configKey: 'events.volume',
      data: [],
      tsRangeBegin: null,
      tsRangeEnd: null,
      userTimezone: 'UTC',
      stackBy: null
    })

    const { labelWidthCache, resetTickCache } = api
    expect(labelWidthCache).toBeInstanceOf(Map)
    expect(typeof resetTickCache).toBe('function')

    const labels = buildHourMinuteLabels(10)
    const chartData = buildChartData(labels)

    buildC3Config({
      chartRef: FAKE_CHART_REF,
      chartData,
      chartConfig: FAKE_CHART_CONFIG,
      chartKind: CHART_KINDS.SINGLE_SERIES_HISTOGRAM,
      chartContainer: buildChartContainer(192),
      breakpoint: 'desktop',
      labelWidthCache
    })
    expect(rectSpy).toHaveBeenCalledTimes(1)
    expect(labelWidthCache.size).toBe(1)

    // Reset clears the map (composable-scoped, not module-scoped).
    resetTickCache()
    expect(labelWidthCache.size).toBe(0)

    // Same formatKey now misses again ⇒ measurement runs.
    buildC3Config({
      chartRef: FAKE_CHART_REF,
      chartData,
      chartConfig: FAKE_CHART_CONFIG,
      chartKind: CHART_KINDS.SINGLE_SERIES_HISTOGRAM,
      chartContainer: buildChartContainer(192),
      breakpoint: 'desktop',
      labelWidthCache
    })
    expect(rectSpy).toHaveBeenCalledTimes(2)
    expect(labelWidthCache.size).toBe(1)

    wrapper.unmount()
  })

  it('isolates caches between separate useChartBuilder instances', () => {
    const first = mountChartBuilder({
      configKey: 'events.volume',
      data: [],
      tsRangeBegin: null,
      tsRangeEnd: null,
      userTimezone: 'UTC',
      stackBy: null
    })
    const second = mountChartBuilder({
      configKey: 'events.volume',
      data: [],
      tsRangeBegin: null,
      tsRangeEnd: null,
      userTimezone: 'UTC',
      stackBy: null
    })

    expect(first.api.labelWidthCache).not.toBe(second.api.labelWidthCache)

    const labels = buildHourMinuteLabels(10)
    const chartData = buildChartData(labels)

    buildC3Config({
      chartRef: FAKE_CHART_REF,
      chartData,
      chartConfig: FAKE_CHART_CONFIG,
      chartKind: CHART_KINDS.SINGLE_SERIES_HISTOGRAM,
      chartContainer: buildChartContainer(192),
      breakpoint: 'desktop',
      labelWidthCache: first.api.labelWidthCache
    })

    expect(first.api.labelWidthCache.size).toBe(1)
    // Sibling cache is untouched — confirms composable-scoped isolation.
    expect(second.api.labelWidthCache.size).toBe(0)

    first.wrapper.unmount()
    second.wrapper.unmount()
  })
})

/* ------------------------------------------------------------------ */
/* C) Format / rotate by breakpoint                                    */
/* ------------------------------------------------------------------ */

describe('useChartBuilder — rotation by breakpoint', () => {
  // Picking numbers so the overlap condition (`containerWidth / N < slotWidth`)
  // can fire after decimation:
  //
  //   labelWidth = 40 (default spy)  ⇒ slotWidth = 48
  //   container  = 30 px             ⇒ maxTicks = max(1, floor(30/48)) = 1
  //   natural    = 20                ⇒ decimation kicks in; values.length = 1
  //                                    (preserveFirst takes precedence in the
  //                                     targetCount === 1 branch).
  //   containerWidth / values.length = 30 < 48 ⇒ overlap TRUE
  //
  // This shape is the only way to make the overlap check return true given
  // the floor() relationship between maxTicks and slotWidth.
  const NARROW_CONTAINER_WIDTH = 30
  const LARGE_LABEL_COUNT = 20

  it('does not rotate labels on desktop even when decimated ticks would overlap', () => {
    const labels = buildHourMinuteLabels(LARGE_LABEL_COUNT)
    const config = buildC3Config({
      chartRef: FAKE_CHART_REF,
      chartData: buildChartData(labels),
      chartConfig: FAKE_CHART_CONFIG,
      chartKind: CHART_KINDS.SINGLE_SERIES_HISTOGRAM,
      chartContainer: buildChartContainer(NARROW_CONTAINER_WIDTH),
      breakpoint: 'desktop',
      labelWidthCache: new Map()
    })

    expect(config.axis.x.tick.rotate).toBe(0)
    // Decimation still happens — only rotation differs by breakpoint.
    expect(Array.isArray(config.axis.x.tick.values)).toBe(true)
  })

  it('does not rotate labels on xl regardless of density', () => {
    const labels = buildHourMinuteLabels(LARGE_LABEL_COUNT)
    const config = buildC3Config({
      chartRef: FAKE_CHART_REF,
      chartData: buildChartData(labels),
      chartConfig: FAKE_CHART_CONFIG,
      chartKind: CHART_KINDS.SINGLE_SERIES_HISTOGRAM,
      chartContainer: buildChartContainer(NARROW_CONTAINER_WIDTH),
      breakpoint: 'xl',
      labelWidthCache: new Map()
    })

    expect(config.axis.x.tick.rotate).toBe(0)
  })

  it('rotates labels to -45 on mobile when decimated ticks still overlap', () => {
    const labels = buildHourMinuteLabels(LARGE_LABEL_COUNT)
    const config = buildC3Config({
      chartRef: FAKE_CHART_REF,
      chartData: buildChartData(labels),
      chartConfig: FAKE_CHART_CONFIG,
      chartKind: CHART_KINDS.SINGLE_SERIES_HISTOGRAM,
      chartContainer: buildChartContainer(NARROW_CONTAINER_WIDTH),
      breakpoint: 'mobile',
      labelWidthCache: new Map()
    })

    expect(config.axis.x.tick.rotate).toBe(-45)
  })

  it('rotates labels to -45 on tablet when decimated ticks still overlap', () => {
    const labels = buildHourMinuteLabels(LARGE_LABEL_COUNT)
    const config = buildC3Config({
      chartRef: FAKE_CHART_REF,
      chartData: buildChartData(labels),
      chartConfig: FAKE_CHART_CONFIG,
      chartKind: CHART_KINDS.SINGLE_SERIES_HISTOGRAM,
      chartContainer: buildChartContainer(NARROW_CONTAINER_WIDTH),
      breakpoint: 'tablet',
      labelWidthCache: new Map()
    })

    expect(config.axis.x.tick.rotate).toBe(-45)
  })

  it('rotates labels to -45 on mobile-s when decimated ticks still overlap', () => {
    const labels = buildHourMinuteLabels(LARGE_LABEL_COUNT)
    const config = buildC3Config({
      chartRef: FAKE_CHART_REF,
      chartData: buildChartData(labels),
      chartConfig: FAKE_CHART_CONFIG,
      chartKind: CHART_KINDS.SINGLE_SERIES_HISTOGRAM,
      chartContainer: buildChartContainer(NARROW_CONTAINER_WIDTH),
      breakpoint: 'mobile-s',
      labelWidthCache: new Map()
    })

    expect(config.axis.x.tick.rotate).toBe(-45)
  })

  it('keeps labels horizontal on mobile when no overlap is expected after decimation', () => {
    // slotWidth ≈ 76 (43 × 1.4 + 16); container 880 ⇒ maxTicks = 11.
    // 10 natural ticks < 11 ⇒ no decimation. containerWidth/naturalTicks = 88
    // > slotWidth (76), so overlap condition false ⇒ rotate = 0.
    const labels = buildHourMinuteLabels(10)
    const config = buildC3Config({
      chartRef: FAKE_CHART_REF,
      chartData: buildChartData(labels),
      chartConfig: FAKE_CHART_CONFIG,
      chartKind: CHART_KINDS.SINGLE_SERIES_HISTOGRAM,
      chartContainer: buildChartContainer(880),
      breakpoint: 'mobile',
      labelWidthCache: new Map()
    })

    expect(config.axis.x.tick.rotate).toBe(0)
    // No decimation needed — `values` patch is absent.
    expect(config.axis.x.tick.values).toBeUndefined()
  })
})
