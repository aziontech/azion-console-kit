/* eslint-disable xss/no-mixed-html -- `template` strings here are Vue stub component templates, not HTML sinks */
/**
 * Property P6 — Auto-refresh visibility pause + catch-up
 * ---------------------------------------------------------------------
 * Validates the visibility-aware auto-refresh gate added to
 * `advanced-filter-system-v2/index.vue`:
 *
 *   1. Tick handler emits `updatedFilter` when the tab is visible.
 *   2. Tick handler is a no-op while `document.visibilityState === 'hidden'`.
 *   3. On the hidden→visible transition, `onVisible(...)` fires a catch-up
 *      tick **only** when `Date.now() - lastTickAt > refreshIntervalMs`.
 *   4. No catch-up fires when the elapsed window is below the configured
 *      interval.
 *
 * Strategy
 * --------
 * The real scheduler (`setTimeout`) lives in the child `DataTimeRange`/
 * `QuickSelect`. We do not test the timer here — we stub every child and
 * drive the parent by emitting `@autoRefresh` from the `DataTimeRange`
 * stub. Visibility transitions are simulated by overriding
 * `document.visibilityState` (configurable getter) and dispatching a
 * `visibilitychange` event, which the `useVisibility` composable listens
 * to.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'

import AdvancedFilterSystem from '../index.vue'

/* ------------------------------------------------------------------ */
/* Test harness state                                                  */
/* ------------------------------------------------------------------ */

let visibilityState
let visibilityListeners

const setVisibility = (next) => {
  visibilityState = next
  // Fire synchronously to mirror real browser behaviour.
  for (const handler of [...visibilityListeners]) handler()
}

/* ------------------------------------------------------------------ */
/* Child component stubs                                               */
/* ------------------------------------------------------------------ */

const DataTimeRangeStub = {
  name: 'DataTimeRange',
  emits: ['autoRefresh', 'update:modelValue', 'select'],
  template: '<div data-testid="stub-data-time-range" />',
  methods: {
    closeOverlay() {
      /* noop */
    }
  }
}

const FilterFieldsStub = {
  name: 'FilterFields',
  emits: ['apply-filter', 'update:modelValue'],
  template: '<div data-testid="stub-filter-fields" />'
}

const AzionQueryLanguageStub = {
  name: 'AzionQueryLanguage',
  // Declare every prop the parent passes so Vue does not try to apply
  // them as fallthrough attrs on the root <div> (e.g. `dataset` clashes
  // with the DOM's read-only `HTMLElement.dataset` getter).
  props: ['fieldsInFilter', 'searchAdvancedFilter', 'filterAdvanced', 'dataset'],
  emits: ['dirty', 'validation'],
  template: '<div data-testid="stub-aql" />',
  methods: {
    getParsedFilters() {
      return []
    },
    markAsApplied() {
      /* noop */
    }
  }
}

const FilterTagsDisplayStub = {
  name: 'FilterTagsDisplay',
  emits: ['removeFilter'],
  template: '<div data-testid="stub-filter-tags" />'
}

const PrimeButtonStub = {
  name: 'PrimeButton',
  emits: ['click'],
  template: '<button />'
}

/* ------------------------------------------------------------------ */
/* Service / module mocks                                              */
/* ------------------------------------------------------------------ */

vi.mock('@/services/users-services', () => ({
  listTimezonesService: vi.fn().mockResolvedValue([])
}))

/* ------------------------------------------------------------------ */
/* Mount helpers                                                       */
/* ------------------------------------------------------------------ */

const buildFilterData = ({ tsRange: tsRangeOverrides = {}, ...rest } = {}) => ({
  fields: [],
  tsRange: {
    tsRangeBegin: '2026-01-01T00:00:00Z',
    tsRangeEnd: '2026-01-01T01:00:00Z',
    label: '',
    labelStart: '',
    labelEnd: '',
    ...tsRangeOverrides
  },
  ...rest
})

const mountFilter = (filterDataOverrides = {}) => {
  const filterData = buildFilterData(filterDataOverrides)

  const wrapper = mount(AdvancedFilterSystem, {
    props: {
      filterData,
      'onUpdate:filterData': (value) => {
        wrapper.setProps({ filterData: value })
      },
      fieldsInFilter: [],
      filterDateRangeMaxDays: 30,
      isLoadingFilters: false,
      hideFilterTags: false,
      dataset: 'httpEvents'
    },
    global: {
      plugins: [createPinia()],
      stubs: {
        DataTimeRange: DataTimeRangeStub,
        FilterFields: FilterFieldsStub,
        AzionQueryLanguage: AzionQueryLanguageStub,
        FilterTagsDisplay: FilterTagsDisplayStub,
        PrimeButton: PrimeButtonStub
      }
    }
  })

  return wrapper
}

const triggerAutoRefresh = async (wrapper) => {
  const child = wrapper.findComponent(DataTimeRangeStub)
  child.vm.$emit('autoRefresh')
  await nextTick()
}

/* ------------------------------------------------------------------ */
/* Global lifecycle                                                    */
/* ------------------------------------------------------------------ */

let originalVisibilityDescriptor
let addEventListenerSpy
let removeEventListenerSpy

beforeEach(() => {
  // Pin Date.now() (via fake timers) so we can reason about elapsed
  // milliseconds deterministically without scheduling real timers.
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))

  // ── matchMedia stub for `useBreakpoint`. Defaults to desktop width so
  //    `isMobileViewport` is false and the labels render normally.
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({
      matches: false,
      media: '',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn()
    }))
  )
  if (typeof window !== 'undefined') {
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      writable: true,
      // eslint-disable-next-line no-undef
      value: globalThis.matchMedia
    })
  }

  // ── visibilityState override. Keep a reference to the original
  //    descriptor so we can restore it in afterEach.
  visibilityState = 'visible'
  visibilityListeners = new Set()
  originalVisibilityDescriptor = Object.getOwnPropertyDescriptor(document, 'visibilityState')
  Object.defineProperty(document, 'visibilityState', {
    configurable: true,
    get: () => visibilityState
  })

  // Intercept visibilitychange registrations so we control the listener
  // pool. All other events fall through to the real implementation.
  const realAdd = document.addEventListener.bind(document)
  const realRemove = document.removeEventListener.bind(document)

  addEventListenerSpy = vi
    .spyOn(document, 'addEventListener')
    .mockImplementation((event, handler, options) => {
      if (event === 'visibilitychange') {
        visibilityListeners.add(handler)
        return undefined
      }
      return realAdd(event, handler, options)
    })

  removeEventListenerSpy = vi
    .spyOn(document, 'removeEventListener')
    .mockImplementation((event, handler, options) => {
      if (event === 'visibilitychange') {
        visibilityListeners.delete(handler)
        return undefined
      }
      return realRemove(event, handler, options)
    })
})

afterEach(() => {
  if (originalVisibilityDescriptor) {
    Object.defineProperty(document, 'visibilityState', originalVisibilityDescriptor)
  } else {
    delete document.visibilityState
  }
  addEventListenerSpy?.mockRestore()
  removeEventListenerSpy?.mockRestore()
  vi.useRealTimers()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

/* ================================================================== */
/* Tests                                                               */
/* ================================================================== */

describe('Property P6 — Auto-refresh visibility pause + catch-up', () => {
  it('emits updatedFilter on tick when document is visible', async () => {
    const wrapper = mountFilter()
    await nextTick()

    await triggerAutoRefresh(wrapper)

    const emitted = wrapper.emitted('updatedFilter')
    expect(emitted).toBeTruthy()
    expect(emitted.length).toBe(1)

    wrapper.unmount()
  })

  it('does NOT emit updatedFilter while document is hidden', async () => {
    const wrapper = mountFilter()
    await nextTick()

    // Flip to hidden BEFORE the tick — the composable should observe
    // `isHidden === true` and gate the handler.
    setVisibility('hidden')
    await nextTick()

    await triggerAutoRefresh(wrapper)

    expect(wrapper.emitted('updatedFilter')).toBeUndefined()

    wrapper.unmount()
  })

  it('fires catch-up tick on hidden→visible when elapsed > refreshIntervalMs', async () => {
    // Configure a 30s refresh interval BEFORE mount so the
    // composable's `getAutoRefreshIntervalMs()` resolves to 30000.
    const wrapper = mountFilter({
      tsRange: {
        autoRefresh: { enabled: true, every: 30, unit: 'seconds' }
      }
    })
    await nextTick()

    // Initial tick at t=0 — sets `lastTickAt`.
    await triggerAutoRefresh(wrapper)
    expect(wrapper.emitted('updatedFilter')?.length).toBe(1)

    // Hide the tab.
    setVisibility('hidden')
    await nextTick()

    // 60s elapse — twice the configured interval.
    vi.advanceTimersByTime(60_000)

    // Tab returns to foreground; catch-up should fire because
    // `Date.now() - lastTickAt === 60000 > 30000`.
    setVisibility('visible')
    await nextTick()

    const emitted = wrapper.emitted('updatedFilter')
    expect(emitted).toBeTruthy()
    expect(emitted.length).toBe(2)

    wrapper.unmount()
  })

  it('does NOT fire catch-up on hidden→visible when elapsed <= refreshIntervalMs', async () => {
    const wrapper = mountFilter({
      tsRange: {
        autoRefresh: { enabled: true, every: 30, unit: 'seconds' }
      }
    })
    await nextTick()

    await triggerAutoRefresh(wrapper)
    expect(wrapper.emitted('updatedFilter')?.length).toBe(1)

    setVisibility('hidden')
    await nextTick()

    // Only 10s pass — below the 30s interval, so no catch-up.
    vi.advanceTimersByTime(10_000)

    setVisibility('visible')
    await nextTick()

    // Still only the one tick emitted before going hidden.
    expect(wrapper.emitted('updatedFilter')?.length).toBe(1)

    wrapper.unmount()
  })

  it('skips catch-up when no autoRefresh config is set (interval is null)', async () => {
    // No autoRefresh in tsRange → `getAutoRefreshIntervalMs()` → null
    // → onVisible callback returns early regardless of elapsed time.
    const wrapper = mountFilter()
    await nextTick()

    await triggerAutoRefresh(wrapper)
    expect(wrapper.emitted('updatedFilter')?.length).toBe(1)

    setVisibility('hidden')
    await nextTick()

    vi.advanceTimersByTime(10 * 60 * 1000) // 10 minutes

    setVisibility('visible')
    await nextTick()

    // No catch-up — only the original tick remains.
    expect(wrapper.emitted('updatedFilter')?.length).toBe(1)

    wrapper.unmount()
  })
})
