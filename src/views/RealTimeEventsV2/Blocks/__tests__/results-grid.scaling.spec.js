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
 * Task 3.8 — real-measurement SCALE tests for the virtualized results grid
 * (`VirtualEventTable`), driven by the shared measurement helpers
 * (`src/views/RealTimeEventsV2/__tests__/_helpers/measurement.js`).
 *
 * These assert the three render invariants the Fase 1 refactor exists to buy,
 * measured against the REAL component (no PrimeVue stubs — VirtualEventTable
 * owns its own <table>/<thead>/<tbody>), at N=100 vs N=10000:
 *
 *  - P1 — the LIVE `ResizeObserver` count of the table is EQUAL at N=100 and
 *    N=10000 (one shared overflow observer + one shared row-height observer +
 *    one viewport observer per table — O(1) in the dataset, not one-per-row as
 *    the v1 log-field-badges did). Proven with `installResizeObserverCounter`.
 *  - P2 — mounted rows ≤ visible + overscan, and the total DOM node count at
 *    10k is ≤ node count at 100 + a fixed margin (windowing keeps the surface
 *    bounded). Proven with `countMountedRows` / `countDomNodes`.
 *  - P10 — selection / active / expanded stay attributed BY IDENTITY (`row.id`)
 *    across a window recycle (scroll) and a logical reorder (sort): the row
 *    bearing a given `data-row-id` keeps its state and no OTHER mounted row
 *    steals it — recycle delta == 0.
 *
 * jsdom reports `clientHeight = 0` and a zero-size `getBoundingClientRect`, so
 * we force a real viewport height on the scroll container and a measurable row
 * height, letting `useRowWindow` compute a bounded visible slice + fixed
 * overscan (overscan=6 in VirtualEventTable). Scrolling is simulated by writing
 * `scrollTop` on the viewport and dispatching a `scroll` event.
 */

const VIEWPORT_HEIGHT = 600
const ROW_HEIGHT = 44
const OVERSCAN = 6 // must mirror VirtualEventTable's useRowWindow({ overscan })

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
  // Force a non-zero viewport height (jsdom returns 0 for clientHeight) so the
  // windower produces a real "visible + overscan" slice rather than degenerating.
  clientHeightSpy = vi
    .spyOn(HTMLElement.prototype, 'clientHeight', 'get')
    .mockReturnValue(VIEWPORT_HEIGHT)
  // Give every element a fixed, plausible height so measureRow records a finite
  // value and the prefix-sum offsets are deterministic.
  boundingRectSpy = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
    width: 800,
    height: ROW_HEIGHT,
    top: 0,
    left: 0,
    right: 800,
    bottom: ROW_HEIGHT,
    offsetX: 0,
    offsetY: 0,
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
    props: {
      data: makeData(100),
      selectedFields: [],
      getFieldValue,
      ...props
    },
    global: {
      stubs: {
        PrimeButton: { template: '<button><slot /></button>' },
        Skeleton: { template: '<div class="skeleton-stub" />' },
        EmptyResultsBlock: { template: '<div class="empty-stub"><slot /></div>' },
        EventDocumentView: {
          name: 'EventDocumentView',
          props: ['data', 'isLoading', 'compact'],
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

// Settle the two-phase mount → measure → re-window cycle.
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

const bodyRows = (wrapper) => wrapper.findAll('[data-testid="table-body-row"]')
const rowIdSet = (wrapper) =>
  new Set(bodyRows(wrapper).map((row) => Number(row.attributes('data-row-id'))))

describe('results grid — SCALE invariants (P1 observers, P2 DOM, P10 identity)', () => {
  let roCounter

  beforeEach(() => {
    roCounter = installResizeObserverCounter()
    installLayoutStubs()
  })
  afterEach(() => {
    restoreLayoutStubs()
    roCounter.restore()
  })

  // ─── P1: live ResizeObserver count EQUAL at N=100 vs N=10000 ────────────────
  it('P1 — live ResizeObserver count is EQUAL at N=100 and N=10000 (O(1), not per-row)', async () => {
    const small = mountTable({ data: makeData(100) })
    await settle()
    const smallObservers = roCounter.liveCount()

    small.unmount()
    await nextTick()
    // Symmetric teardown: every observer the table owns is disconnected on unmount.
    expect(roCounter.liveCount()).toBe(0)

    const large = mountTable({ data: makeData(10000) })
    await settle()
    const largeObservers = roCounter.liveCount()

    // A small, fixed set of shared observers — never one per rendered row.
    expect(smallObservers).toBeGreaterThan(0)
    expect(smallObservers).toBeLessThan(10)
    // THE invariant: identical live-observer count regardless of dataset size.
    expect(largeObservers).toBe(smallObservers)

    large.unmount()
    await nextTick()
    expect(roCounter.liveCount()).toBe(0)
  })

  // ─── P2: mounted rows ≤ visible + overscan; DOM(10k) ≤ DOM(100) + margin ────
  it('P2 — mounted rows are bounded (≤ visible + overscan) and EQUAL at N=100 vs N=10000', async () => {
    const small = mountTable({ data: makeData(100) })
    await settle()
    const smallRows = countMountedRows(small)

    const large = mountTable({ data: makeData(10000) })
    await settle()
    const largeRows = countMountedRows(large)

    // visible = ceil(viewport / rowHeight); windowed slice = visible + 2×overscan
    // (+1 for the exclusive-end partial row). This is the theoretical upper bound.
    const visible = Math.ceil(VIEWPORT_HEIGHT / ROW_HEIGHT)
    const maxWindow = visible + 2 * OVERSCAN + 1

    expect(smallRows).toBeGreaterThan(0)
    expect(smallRows).toBeLessThanOrEqual(maxWindow)
    expect(largeRows).toBeLessThanOrEqual(maxWindow)
    // Same viewport + same row heights ⇒ identical visible slice for both sizes.
    expect(largeRows).toBe(smallRows)
    // And nowhere near the 100×-larger dataset.
    expect(largeRows).toBeLessThan(100)

    small.unmount()
    large.unmount()
  })

  it('P2 — total DOM node count at 10k is ≤ node count at 100 + a fixed margin', async () => {
    const small = mountTable({ data: makeData(100) })
    await settle()
    const smallNodes = countDomNodes(small)

    const large = mountTable({ data: makeData(10000) })
    await settle()
    const largeNodes = countDomNodes(large)

    // The only structural difference between 100 and 10000 is the spacer
    // <td> heights (a style attribute, not extra nodes) — so the node count must
    // NOT grow by anywhere near the 9900-row delta. A tiny fixed margin absorbs
    // spacer-row presence/absence at the window edges.
    const FIXED_MARGIN = 8
    expect(smallNodes).toBeGreaterThan(0)
    expect(largeNodes).toBeLessThanOrEqual(smallNodes + FIXED_MARGIN)

    small.unmount()
    large.unmount()
  })

  // ─── P10: selection / active / expanded preserved BY IDENTITY under recycle ──
  it('P10 — active state stays attached to the SAME row id after a scroll recycle (delta 0)', async () => {
    const data = makeData(10000)
    // Active resolution is id-based both via the parent-supplied rowClass and via
    // isRowActive (design §2.1(1)); mirror the parent's id-keyed resolvers here.
    const activeId = 5000
    const isRowActive = (row) => row.id === activeId
    const rowClass = (row) => (row.id === activeId ? 'row--active' : '')

    const wrapper = mountTable({ data, isRowActive, rowClass })
    await settle()

    // Scroll so the window recycles to include the active row (row 5000).
    await scrollTo(wrapper, (activeId - 1) * ROW_HEIGHT - VIEWPORT_HEIGHT / 2)

    const mounted = rowIdSet(wrapper)
    expect(mounted.has(activeId)).toBe(true)

    // EXACTLY the active-id row carries row--active + the active chevron; no
    // recycled neighbour steals the state (positional model would mis-attribute).
    const activeRows = wrapper.findAll('[data-testid="table-body-row"].row--active')
    expect(activeRows.length).toBe(1)
    expect(Number(activeRows[0].attributes('data-row-id'))).toBe(activeId)

    const activeChevrons = wrapper.findAll('.expand-indicator--active')
    expect(activeChevrons.length).toBe(1)
    const chevronRow = activeChevrons[0].element.closest('[data-testid="table-body-row"]')
    expect(Number(chevronRow.getAttribute('data-row-id'))).toBe(activeId)

    wrapper.unmount()
  })

  it('P10 — inline expansion stays attached to the SAME row id after a scroll recycle', async () => {
    const data = makeData(10000)
    const expandedId = 5000
    const expandedRow = data[expandedId - 1]

    const wrapper = mountTable({
      data,
      detailViewMode: 'inline',
      expandedRows: [expandedRow] // array-of-row-objects contract (drop-in)
    })
    await settle()

    await scrollTo(wrapper, (expandedId - 1) * ROW_HEIGHT - VIEWPORT_HEIGHT / 2)

    expect(rowIdSet(wrapper).has(expandedId)).toBe(true)

    // Exactly one inline expansion row, and it targets the expanded id — never a
    // positional neighbour in the recycled window.
    const expansions = wrapper.findAll('.virtual-expansion-row')
    expect(expansions.length).toBe(1)
    expect(Number(expansions[0].attributes('data-row-expansion-id'))).toBe(expandedId)

    wrapper.unmount()
  })

  it('P10 — active state tracks the row id across a logical reorder (sort), delta 0', async () => {
    const data = makeData(200)
    const activeId = 200 // the LAST row by input order → first after ascending sort
    const isRowActive = (row) => row.id === activeId
    const rowClass = (row) => (row.id === activeId ? 'row--active' : '')

    const wrapper = mountTable({ data, isRowActive, rowClass })
    await settle()

    // Initially the window shows the low ids (input order = ascending id); id=200
    // is NOT mounted yet. Descending sort by the numeric `ts` key (asc → desc =
    // two clicks) brings id=200 to the TOP of the logical set, so it enters the
    // window. A positional selection would now point at whatever row previously
    // sat at the top instead of following id=200.
    expect(rowIdSet(wrapper).has(activeId)).toBe(false)
    const timeHeader = wrapper.find('th.col-time')
    await timeHeader.trigger('click') // asc
    await settle()
    await timeHeader.trigger('click') // desc → id=200 to the top
    await settle()

    // id=200 is now first — it must be mounted and it alone carries row--active.
    const mounted = bodyRows(wrapper)
    expect(Number(mounted[0].attributes('data-row-id'))).toBe(activeId)

    const activeRows = wrapper.findAll('[data-testid="table-body-row"].row--active')
    expect(activeRows.length).toBe(1)
    expect(Number(activeRows[0].attributes('data-row-id'))).toBe(activeId)

    wrapper.unmount()
  })
})
