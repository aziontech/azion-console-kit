/* eslint-disable xss/no-mixed-html -- jsdom test harness: Vue stub templates + layout-spy setup, not HTML sinks */
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, KeepAlive, nextTick, ref } from 'vue'
import VirtualEventTable from '@/views/RealTimeEventsV2/Blocks/components/VirtualEventTable.vue'
import { installResizeObserverCounter } from '@/views/RealTimeEventsV2/__tests__/_helpers/measurement.js'

/**
 * ANGLE H1 — adversarial probe of the RECENT ROOT A viewport-observer fix.
 *
 * We count LIVE ResizeObservers across:
 *   (a) plain mount at N=100 vs N=10000 (O(1), not O(rows)),
 *   (b) isLoading true→false→true cycles (viewport ref churn),
 *   (c) keep-alive activate/deactivate cycles,
 *   (d) unmount teardown → back to 0.
 *
 * VirtualEventTable owns THREE observer sources:
 *   - viewportObserver (acquireViewportObserver — release-first / idempotent),
 *   - rowHeightObserver (acquireRowHeightObserver — NOT release-first),
 *   - useOverflowMeasure's single observer (via useKeepAliveResource, guarded).
 */

const VIEWPORT_HEIGHT = 600
const ROW_HEIGHT = 44

const makeRow = (id) => ({
  id,
  ts: id,
  tsFormat: `2024-01-01T00:00:${String(id % 60).padStart(2, '0')}Z`,
  summary: [{ key: 'host', value: `host-${id}.example.com` }]
})

const getFieldValue = (row, key) => {
  const fieldName = key.replace('field_', '')
  const entry = row.summary?.find((item) => item.key === fieldName)
  return entry ? String(entry.value) : '-'
}

const STUBS = {
  PrimeButton: { template: '<button><slot /></button>' },
  Skeleton: { template: '<div />' },
  EmptyResultsBlock: { template: '<div><slot /></div>' },
  LogFieldBadges: { template: '<div class="log-badges-container" />' },
  EventDocumentView: { template: '<div />' }
}

let clientHeightSpy, boundingRectSpy, roCounter

beforeEach(() => {
  clientHeightSpy = vi
    .spyOn(HTMLElement.prototype, 'clientHeight', 'get')
    .mockReturnValue(VIEWPORT_HEIGHT)
  boundingRectSpy = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
    width: 800,
    height: ROW_HEIGHT,
    top: 0,
    left: 0,
    right: 800,
    bottom: ROW_HEIGHT,
    toJSON: () => {}
  })
  roCounter = installResizeObserverCounter()
})

afterEach(() => {
  clientHeightSpy?.mockRestore()
  boundingRectSpy?.mockRestore()
  roCounter?.restore()
})

const baseProps = (rowCount) => ({
  data: Array.from({ length: rowCount }, (_unused, idx) => makeRow(idx + 1)),
  selectedFields: [],
  getFieldValue,
  isLoading: false
})

const mountPlain = (rowCount) =>
  mount(VirtualEventTable, {
    attachTo: document.body,
    props: baseProps(rowCount),
    global: { stubs: STUBS, directives: { tooltip: {} } }
  })

// KeepAlive harness: toggling `show` deactivates/activates the cached instance.
const mountKeptAlive = (rowCount) => {
  const show = ref(true)
  const props = baseProps(rowCount)
  const Host = defineComponent({
    setup() {
      return () =>
        h(KeepAlive, null, {
          default: () => (show.value ? h(VirtualEventTable, props) : null)
        })
    }
  })
  const wrapper = mount(Host, {
    attachTo: document.body,
    global: { stubs: STUBS, directives: { tooltip: {} } }
  })
  return { wrapper, show }
}

describe('H1 — viewport / row-height observer leak audit', () => {
  it('(a) live observer count is O(1): equal at N=100 and N=10000', async () => {
    const small = mountPlain(100)
    await nextTick()
    await nextTick()
    const liveSmall = roCounter.liveCount()
    const rowsSmall = small.findAll('[data-testid="table-body-row"]').length
    small.unmount()
    await nextTick()

    roCounter.reset()

    const big = mountPlain(10000)
    await nextTick()
    await nextTick()
    const liveBig = roCounter.liveCount()
    const rowsBig = big.findAll('[data-testid="table-body-row"]').length
    big.unmount()
    await nextTick()

    // Live observers must NOT scale with dataset size.
    expect(liveBig).toBe(liveSmall)
    // Sanity: rows are windowed (bounded), not O(docs).
    expect(rowsSmall).toBeLessThan(60)
    expect(rowsBig).toBeLessThan(60)

    // eslint-disable-next-line no-console
    console.log(
      '[H1-a] liveSmall=%d liveBig=%d rowsSmall=%d rowsBig=%d',
      liveSmall,
      liveBig,
      rowsSmall,
      rowsBig
    )
  })

  it('(b) isLoading true→false cycles do NOT grow live observers', async () => {
    const wrapper = mountPlain(200)
    await nextTick()
    await nextTick()
    const baseline = roCounter.liveCount()

    const samples = []
    for (let cycle = 0; cycle < 5; cycle += 1) {
      await wrapper.setProps({ isLoading: true })
      await nextTick()
      await wrapper.setProps({ isLoading: false })
      await nextTick()
      await nextTick()
      samples.push(roCounter.liveCount())
    }

    // No monotonic growth: last cycle equals first cycle equals baseline.
    expect(samples.every((sample) => sample === baseline)).toBe(true)

    wrapper.unmount()
    await nextTick()
    const afterUnmount = roCounter.liveCount()

    // eslint-disable-next-line no-console
    console.log('[H1-b] baseline=%d samples=%o afterUnmount=%d', baseline, samples, afterUnmount)
    expect(afterUnmount).toBe(0)
  })

  it('(c) keep-alive activate/deactivate cycles do NOT grow, and unmount returns to 0', async () => {
    const { wrapper, show } = mountKeptAlive(200)
    await nextTick()
    await nextTick()

    const afterFirstActivate = roCounter.liveCount()

    const deactSamples = []
    const actSamples = []
    for (let cycle = 0; cycle < 4; cycle += 1) {
      show.value = false // deactivate
      await nextTick()
      await nextTick()
      deactSamples.push(roCounter.liveCount())

      show.value = true // activate
      await nextTick()
      await nextTick()
      actSamples.push(roCounter.liveCount())
    }

    wrapper.unmount()
    await nextTick()
    const afterUnmount = roCounter.liveCount()

    // eslint-disable-next-line no-console
    console.log(
      '[H1-c] afterFirstActivate=%d deact=%o act=%o afterUnmount=%d',
      afterFirstActivate,
      deactSamples,
      actSamples,
      afterUnmount
    )

    // No per-cycle growth in either phase.
    expect(new Set(deactSamples).size).toBe(1)
    expect(new Set(actSamples).size).toBe(1)
    // Full teardown must free every observer.
    expect(afterUnmount).toBe(0)
    // Deactivated state should ideally free everything too (symmetric teardown).
    expect(deactSamples[deactSamples.length - 1]).toBe(0)
  })

  it('(d) repeated keep-alive mount→unmount lifecycles LEAK an observer each time (accumulates)', async () => {
    const leakedPerInstance = []
    for (let instance = 0; instance < 5; instance += 1) {
      const before = roCounter.liveCount()
      const { wrapper } = mountKeptAlive(200)
      await nextTick()
      await nextTick()
      wrapper.unmount()
      await nextTick()
      const after = roCounter.liveCount()
      leakedPerInstance.push(after - before)
    }

    const totalLeaked = roCounter.liveCount()
    // eslint-disable-next-line no-console
    console.log('[H1-d] leakedPerInstance=%o totalLeaked=%d', leakedPerInstance, totalLeaked)

    // Each full mount→unmount under keep-alive should return to net 0. It does
    // NOT: the non-idempotent acquireRowHeightObserver orphans one observer per
    // instance (onMounted + onActivated both create one; only the latest is
    // disconnected on teardown). Over tab open/close churn this accumulates.
    expect(leakedPerInstance.every((delta) => delta === 0)).toBe(true)
    expect(totalLeaked).toBe(0)
  })
})
