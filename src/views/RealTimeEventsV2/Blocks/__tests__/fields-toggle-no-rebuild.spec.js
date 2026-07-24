// Feature: real-time-events-v2-fixes — Task 7.1 / 7.2
// Property 6: toggling the field sidebar (sidebarVisible) does NOT rebuild the
// chart — it must not call `c3.generate` again and must not recreate the c3
// instance. Removing `:key="String(sidebarVisible)"` from the ResizableSplitter
// means panel-b (and the EventChart inside it) is no longer remounted on toggle;
// the parent only nudges a width refit via `eventChartRef.resize()`.
//
// The parent's `watch(sidebarVisible)` calls the EventChart's exposed `resize()`
// (which is `resizeChart` → `chartInstance.resize()`, NOT `c3.generate`). This
// test mounts the real EventChart, drives that exact code path repeatedly, and
// asserts c3.generate fires exactly once (the initial mount build) and the
// instance identity is stable.
//
// Validates: Requirements 3.1, 3.2, 3.4, N.3

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'

// ── Mock c3 so `generate` returns a stable fake instance with a resize spy. ──
// A fresh instance object per `generate` call lets us assert identity stability.
const c3Instances = []
const generateSpy = vi.fn(() => {
  const instance = {
    resize: vi.fn(),
    destroy: vi.fn(),
    tooltip: { show: vi.fn(), hide: vi.fn() }
  }
  c3Instances.push(instance)
  return instance
})
vi.mock('c3', () => ({
  default: { generate: (...args) => generateSpy(...args) }
}))

// ── Mock the chart builder so buildC3Config always yields a truthy config. ──
// This isolates Property 6 from the (separately tested) data→columns pipeline:
// what matters here is WHICH build/resize path fires on a width nudge, not the
// pixel-accurate config. useChartBuilder still returns the reactive surface the
// component consumes.
vi.mock('../../composables/useChartBuilder', async () => {
  const { computed } = await import('vue')
  return {
    useChartBuilder: (props) => ({
      chartConfig: computed(() => ({ id: props.configKey })),
      chartData: computed(() => ({
        columns: [['x', 1, 2, 3]],
        groups: [],
        seriesNames: ['s1'],
        maxValue: 3,
        tooltipLabels: []
      })),
      totalEvents: computed(() => 6),
      formattedTotal: computed(() => '6'),
      chartKind: computed(() => 'histogram'),
      labelWidthCache: new Map(),
      resetTickCache: () => {}
    }),
    buildC3Config: () => ({ bindto: {}, data: { columns: [] } }),
    resetSeriesOrderCache: () => {}
  }
})

import EventChart from '../components/event-chart.vue'

const mountChart = () =>
  mount(EventChart, {
    props: {
      configKey: 'httpRequests',
      data: [{ ts: 1, value: 1 }],
      isLoading: false,
      view: 'events:none',
      viewOptions: [],
      showView: false,
      showSummary: false
    },
    global: {
      stubs: {
        // Webkit presentational children — irrelevant to the build path.
        Skeleton: true,
        InlineMessage: true
      }
    }
  })

describe('Feature: real-time-events-v2-fixes, Property 6: Fields toggle does not rebuild the chart', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    generateSpy.mockClear()
    c3Instances.length = 0

    // jsdom lacks matchMedia (useBreakpoint/usePointerType) and ResizeObserver
    // (the viewport-resources acquire). Provide inert stubs.
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn()
    }))
    window.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
  })

  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
  })

  it('builds the chart exactly once on mount (initChart is debounced 50ms + nextTick)', async () => {
    const wrapper = mountChart()
    // initChart debounces 50ms then generates inside nextTick.
    await vi.advanceTimersByTimeAsync(60)
    await wrapper.vm.$nextTick()

    expect(generateSpy).toHaveBeenCalledTimes(1)
    expect(c3Instances).toHaveLength(1)
    wrapper.unmount()
  })

  it('resize() (the sidebarVisible-toggle safeguard) does NOT call c3.generate', async () => {
    const wrapper = mountChart()
    await vi.advanceTimersByTimeAsync(60)
    await wrapper.vm.$nextTick()

    expect(generateSpy).toHaveBeenCalledTimes(1)
    const initialInstance = c3Instances[0]

    // Mirror what tab-panel-block's `watch(sidebarVisible)` does after removing
    // the `:key`: nextTick → eventChartRef.resize(). Toggle several times.
    for (let toggle = 0; toggle < 5; toggle += 1) {
      wrapper.vm.resize()
      await vi.advanceTimersByTimeAsync(60)
      await wrapper.vm.$nextTick()
    }

    // No rebuild: generate stays at 1, instance identity unchanged.
    expect(generateSpy).toHaveBeenCalledTimes(1)
    expect(c3Instances).toHaveLength(1)
    expect(c3Instances[0]).toBe(initialInstance)
    // resize() delegated to the existing c3 instance instead of regenerating.
    expect(initialInstance.resize).toHaveBeenCalled()
    expect(initialInstance.destroy).not.toHaveBeenCalled()

    wrapper.unmount()
  })

  it('the c3 instance is never recreated across repeated width nudges', async () => {
    const wrapper = mountChart()
    await vi.advanceTimersByTimeAsync(60)
    await wrapper.vm.$nextTick()

    const instanceAfterMount = c3Instances[0]

    // Simulate toggling the sidebar open/closed many times — each toggle only
    // drives a resize, never a remount (no `:key`), so no new instance.
    for (let toggle = 0; toggle < 10; toggle += 1) {
      wrapper.vm.resize()
      await vi.advanceTimersByTimeAsync(60)
      await wrapper.vm.$nextTick()
    }

    expect(c3Instances.every((inst) => inst === instanceAfterMount)).toBe(true)
    expect(generateSpy).toHaveBeenCalledTimes(1)

    wrapper.unmount()
  })
})
