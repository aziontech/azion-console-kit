/* eslint-disable xss/no-mixed-html -- jsdom test harness: Vue stub templates + layout-spy setup, not HTML sinks */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import VirtualEventTable from '../components/VirtualEventTable.vue'
import {
  installResizeObserverCounter,
  countMountedRows,
  countDomNodes
} from '../../__tests__/_helpers/measurement.js'

/**
 * H2 ADVERSARIAL — is DOM/observer count actually O(viewport), or does scrolling
 * / recycling secretly accumulate observers (O(docs) over time)?
 *
 * The existing scaling spec proves the count is EQUAL at N=100 vs N=10000 at the
 * initial paint. This spec is stricter: it SCROLLS the 10k table across the whole
 * dataset (dozens of window recycles) and asserts the live ResizeObserver count
 * and mounted-row count stay flat — i.e. recycled rows really unobserve (the null
 * function-ref call fires) and nothing leaks while the user scrolls.
 */

const VIEWPORT_HEIGHT = 600
const ROW_HEIGHT = 44
const OVERSCAN = 6

const makeRow = (id) => ({
  id,
  ts: id,
  tsFormat: `2024-01-01T00:00:${String(id % 60).padStart(2, '0')}Z`,
  summary: [{ key: 'host', value: `host-${id}` }]
})
const makeData = (count) => Array.from({ length: count }, (unused, index) => makeRow(index + 1))
const getFieldValue = (row, key) => row[key]

let clientHeightSpy
let boundingRectSpy

const installLayoutStubs = () => {
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
}
const restoreLayoutStubs = () => {
  clientHeightSpy?.mockRestore()
  boundingRectSpy?.mockRestore()
}

const mountTable = (props = {}) =>
  mount(VirtualEventTable, {
    attachTo: document.body,
    props: { data: makeData(100), selectedFields: [], getFieldValue, ...props },
    global: {
      stubs: {
        PrimeButton: { template: '<button><slot /></button>' },
        Skeleton: { template: '<div class="skeleton-stub" />' },
        EmptyResultsBlock: { template: '<div class="empty-stub"><slot /></div>' },
        EventDocumentView: {
          name: 'EventDocumentView',
          props: ['data', 'onAddFilter', 'onExcludeFilter', 'isLoading', 'compact'],
          template: '<div class="edv-stub" />'
        },
        LogFieldBadges: {
          props: ['summary', 'highlightFields', 'searchQuery', 'dataset', 'hiddenCount'],
          template: '<div class="log-field-badges-stub"><div class="log-badges-container" /></div>'
        }
      },
      directives: { tooltip: {} }
    }
  })

const settle = async () => {
  await nextTick()
  await nextTick()
  await nextTick()
}

const viewportEl = (wrapper) => wrapper.find('.virtual-table-viewport').element
const scrollTo = async (wrapper, top) => {
  const el = viewportEl(wrapper)
  Object.defineProperty(el, 'scrollTop', { value: top, writable: true, configurable: true })
  el.dispatchEvent(new Event('scroll'))
  await settle()
}

describe('H2 adversarial — observer/DOM count stays O(viewport) across scroll recycles', () => {
  let roCounter

  beforeEach(() => {
    roCounter = installResizeObserverCounter()
    installLayoutStubs()
  })
  afterEach(() => {
    restoreLayoutStubs()
    roCounter.restore()
  })

  // Scroll a mounted table across its whole dataset and return the worst-case
  // (max) live-observer / peak / mounted-row / DOM-node figures seen.
  const scanFullScroll = async (wrapper, rowCount) => {
    const totalHeight = rowCount * ROW_HEIGHT
    const samples = []
    for (let step = 1; step <= 40; step += 1) {
      const top = Math.floor((totalHeight - VIEWPORT_HEIGHT) * (step / 40))
      // eslint-disable-next-line no-await-in-loop
      await scrollTo(wrapper, top)
      samples.push({
        live: roCounter.liveCount(),
        rows: countMountedRows(wrapper),
        nodes: countDomNodes(wrapper)
      })
    }
    return {
      maxLive: Math.max(...samples.map((sample) => sample.live)),
      maxRows: Math.max(...samples.map((sample) => sample.rows)),
      maxNodes: Math.max(...samples.map((sample) => sample.nodes))
    }
  }

  it('observer + DOM node count while scrolling is O(viewport): EQUAL-ish at N=100 vs N=10000', async () => {
    const visible = Math.ceil(VIEWPORT_HEIGHT / ROW_HEIGHT)
    const maxWindow = visible + 2 * OVERSCAN + 1

    // N=100 baseline: scroll the whole (small) dataset, capture worst case.
    const small = mountTable({ data: makeData(100) })
    await settle()
    const smallLiveAtRest = roCounter.liveCount()
    const smallScan = await scanFullScroll(small, 100)
    small.unmount()
    await nextTick()
    expect(roCounter.liveCount()).toBe(0) // symmetric teardown

    // N=10000: scroll the whole (100×) dataset, capture worst case.
    const large = mountTable({ data: makeData(10000) })
    await settle()
    const largeScan = await scanFullScroll(large, 10000)

    // Observers: a small fixed set, and IDENTICAL worst case at 100 and 10000 —
    // recycled rows unobserve, so scrolling 10k rows never accumulates observers.
    expect(smallScan.maxLive).toBeGreaterThan(0)
    expect(smallScan.maxLive).toBeLessThan(10)
    expect(largeScan.maxLive).toBe(smallScan.maxLive)
    expect(largeScan.maxLive).toBe(smallLiveAtRest)

    // Mounted rows: bounded to a viewport window at BOTH sizes.
    expect(largeScan.maxRows).toBeLessThanOrEqual(maxWindow)
    expect(largeScan.maxRows).toBe(smallScan.maxRows)

    // DOM nodes: worst-case surface at 10k equals worst-case at 100 (± tiny
    // spacer-row margin). NOT O(docs): the 9900-row delta adds ZERO nodes.
    expect(largeScan.maxNodes).toBeLessThanOrEqual(smallScan.maxNodes + 8)

    large.unmount()
    await nextTick()
    expect(roCounter.liveCount()).toBe(0)
  })

  it('totalCreated observers is O(1)-ish, NOT O(docs) after a full scroll of 10k', async () => {
    roCounter.reset()
    const wrapper = mountTable({ data: makeData(10000) })
    await settle()

    const totalHeight = 10000 * ROW_HEIGHT
    for (let step = 1; step <= 40; step += 1) {
      const top = Math.floor((totalHeight - VIEWPORT_HEIGHT) * (step / 40))
      // eslint-disable-next-line no-await-in-loop
      await scrollTo(wrapper, top)
    }

    // The 3 shared observers (viewport, row-height, overflow) are created ONCE.
    // Even allowing for viewport re-acquire churn, creation must be a small
    // constant — categorically not proportional to 10000 rows scrolled past.
    const created = roCounter.totalCreated()
    expect(created).toBeLessThan(20)

    wrapper.unmount()
  })
})
