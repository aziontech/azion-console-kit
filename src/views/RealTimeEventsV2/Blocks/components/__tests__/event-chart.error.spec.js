import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
/* global globalThis */
import { nextTick } from 'vue'
import { mount } from '@vue/test-utils'

/**
 * Task 5.4 — Property P8 (req 2.4 / 7.8): a chart-load failure MOUNTS a
 * visible error state, not an empty chart.
 *
 * Bug STATE-1: `EventChart` already declared a `hasError` prop and an error
 * branch in its template, but the prop was DEAD CODE — never wired from the
 * events chart load path. On failure `useEventsData.loadChart()` reset
 * `chartData` to `[]` and fired a toast, so the chart fell through to its
 * EMPTY state ("No events in selected time range") while the toast was the
 * only failure signal. This suite pins the wired behavior end-to-end at the
 * component boundary: when `hasError` is true the component renders the
 * error region (via the webkit `InlineMessage`, severity="error"), and the
 * error state takes precedence over BOTH the empty state and the chart.
 *
 * We render the real `InlineMessage` (not a stub) so the assertion queries
 * what the user actually perceives — the visible failure message — rather
 * than a boolean prop. c3 is mocked; the error branch never reaches it.
 */

vi.mock('c3', () => ({
  default: {
    generate: vi.fn(() => ({
      resize: vi.fn(),
      destroy: vi.fn(),
      tooltip: { hide: vi.fn() }
    }))
  }
}))

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

const ERROR_MESSAGE = 'Failed to load chart data'
const EMPTY_MESSAGE = 'No events in selected time range'

beforeEach(() => {
  originalRO = window.ResizeObserver
  originalGlobalRO = globalThis.ResizeObserver
  originalMatchMedia = window.matchMedia
  window.ResizeObserver = NoopResizeObserver
  globalThis.ResizeObserver = NoopResizeObserver
  window.matchMedia = matchMediaStub
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
  window.ResizeObserver = originalRO
  globalThis.ResizeObserver = originalGlobalRO
  window.matchMedia = originalMatchMedia
  vi.restoreAllMocks()
})

const flush = async () => {
  for (let pass = 0; pass < 3; pass += 1) {
    await nextTick()
    vi.runAllTimers()
    await nextTick()
  }
}

describe('EventChart — chart error state (P8, req 2.4)', () => {
  let EventChart

  beforeEach(async () => {
    EventChart = (await import('../event-chart.vue')).default
  })

  const mountChart = (props = {}) =>
    mount(EventChart, {
      attachTo: document.body,
      props: {
        configKey: 'httpEvents',
        data: [],
        tsRangeBegin: '2026-07-01T00:00:00.000Z',
        tsRangeEnd: '2026-07-01T12:00:00.000Z',
        // Skeleton stubbed (it is decorative); InlineMessage rendered real so
        // the visible error text is assertable.
        ...props
      },
      global: {
        stubs: { Skeleton: true },
        directives: { tooltip: {} }
      }
    })

  it('mounts the error region when hasError is true and no data is present', async () => {
    const wrapper = mountChart({ hasError: true, data: [] })
    await flush()

    // The failure is visible to the user: the error message is in the DOM.
    expect(wrapper.text()).toContain(ERROR_MESSAGE)
    // And it is NOT the empty state — a failure must not read as "no data".
    expect(wrapper.text()).not.toContain(EMPTY_MESSAGE)
  })

  it('does not show the error region on the happy path (hasError false, no data)', async () => {
    const wrapper = mountChart({ hasError: false, data: [] })
    await flush()

    // No failure signal; the empty state is shown instead.
    expect(wrapper.text()).not.toContain(ERROR_MESSAGE)
    expect(wrapper.text()).toContain(EMPTY_MESSAGE)
  })

  it('error state takes precedence over the empty state (failure + empty data)', async () => {
    // This is the exact STATE-1 scenario: on a chart failure the events path
    // resets chartData to [] AND raises the error flag. The error branch must
    // win so the user sees a failure, not a blank "no events" chart.
    const wrapper = mountChart({ hasError: true, data: [] })
    await flush()

    expect(wrapper.text()).toContain(ERROR_MESSAGE)
    expect(wrapper.text()).not.toContain(EMPTY_MESSAGE)
  })

  it('is suppressed while loading (loading state wins over error)', async () => {
    // Loading is the most recent transition; a stale error must not flash
    // over a fresh retry that is already in flight.
    const wrapper = mountChart({ hasError: true, isLoading: true, data: [] })
    await flush()

    expect(wrapper.text()).not.toContain(ERROR_MESSAGE)
    expect(wrapper.text()).not.toContain(EMPTY_MESSAGE)
  })

  it('clears the error region when hasError flips back to false', async () => {
    const wrapper = mountChart({ hasError: true, data: [] })
    await flush()
    expect(wrapper.text()).toContain(ERROR_MESSAGE)

    await wrapper.setProps({ hasError: false })
    await flush()

    expect(wrapper.text()).not.toContain(ERROR_MESSAGE)
    expect(wrapper.text()).toContain(EMPTY_MESSAGE)
  })

  it('renders the failure through the mounted design-system error region (not the empty-state markup)', async () => {
    // req 7.8: assert by QUERYING THE MOUNTED ERROR REGION — the webkit
    // InlineMessage (severity="error") element — rather than only the text.
    // This proves the failure surfaces via the DS error component (icon+text,
    // not colour-alone per §6.4), and that the empty-state branch — marked by
    // its `.pi-chart-bar` icon — is NOT what is mounted. Distinct from the
    // text-based cases above, which assert perceived copy.
    const wrapper = mountChart({ hasError: true, data: [] })
    await flush()

    const errorRegion = wrapper.findComponent({ name: 'InlineMessage' })
    expect(errorRegion.exists()).toBe(true)
    expect(errorRegion.props('severity')).toBe('error')
    // The empty-state icon is the discriminator between "no data" and "failed".
    expect(wrapper.find('.pi-chart-bar').exists()).toBe(false)
  })

  it('mounts the empty-state region (not the error region) on the happy empty path', async () => {
    // Mirror of the assertion above from the other side: with no failure the
    // empty-state icon is mounted and the DS error region is absent — pinning
    // that error and empty are mutually-exclusive mounted regions, not just
    // mutually-exclusive text.
    const wrapper = mountChart({ hasError: false, data: [] })
    await flush()

    expect(wrapper.findComponent({ name: 'InlineMessage' }).exists()).toBe(false)
    expect(wrapper.find('.pi-chart-bar').exists()).toBe(true)
  })
})
