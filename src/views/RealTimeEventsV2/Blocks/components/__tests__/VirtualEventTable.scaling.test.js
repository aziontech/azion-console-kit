import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import VirtualEventTable from '../VirtualEventTable.vue'
import {
  installResizeObserverCounter,
  countMountedRows
} from '../../../__tests__/_helpers/measurement.js'

/**
 * SCALE test (Properties P1 + P2, design §3.14 / tasks Fase 1).
 *
 * Proves the two render invariants of the virtualized table:
 *  - P2 (bounded DOM): the number of mounted `[data-testid="table-body-row"]`
 *    rows is O(viewport), NOT O(dataset). It must be (near) EQUAL at N=100 and
 *    N=10000 — the whole point of windowing.
 *  - P1 (bounded observers): the LIVE ResizeObserver count is CONSTANT across
 *    N=100 vs N=10000 (one shared overflow observer + one shared row-height
 *    observer + one viewport observer per table — not one per row).
 *
 * jsdom reports clientHeight=0, so we force a real viewport height on the scroll
 * container's prototype (getter) and give rows a measurable height, letting the
 * windower compute a bounded visible slice + fixed overscan.
 */

const VIEWPORT_HEIGHT = 600
const ROW_HEIGHT = 44

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
  // Force a non-zero viewport height (jsdom returns 0 for clientHeight).
  clientHeightSpy = vi
    .spyOn(HTMLElement.prototype, 'clientHeight', 'get')
    .mockReturnValue(VIEWPORT_HEIGHT)
  // Give every element a plausible height so measureRow records a finite value.
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

const mountAt = (count) =>
  mount(VirtualEventTable, {
    attachTo: document.body,
    props: { data: makeData(count), selectedFields: [], getFieldValue },
    global: {
      stubs: {
        PrimeButton: { template: '<button><slot /></button>' },
        Skeleton: { template: '<div class="skeleton-stub" />' },
        EmptyResultsBlock: { template: '<div class="empty-stub"><slot /></div>' },
        EventDocumentView: { template: '<div class="edv-stub" />' },
        LogFieldBadges: {
          props: ['summary', 'highlightFields', 'searchQuery', 'dataset', 'hiddenCount'],
          template: '<div class="log-field-badges-stub"><div class="log-badges-container" /></div>'
        }
      },
      directives: { tooltip: {} }
    }
  })

describe('VirtualEventTable — SCALE invariants (P1 observers, P2 DOM)', () => {
  let roCounter

  beforeEach(() => {
    roCounter = installResizeObserverCounter()
    installLayoutStubs()
  })
  afterEach(() => {
    restoreLayoutStubs()
    roCounter.restore()
  })

  it('mounts a bounded, near-equal row count at N=100 and N=10000 (O(viewport), not O(rows))', async () => {
    const small = mountAt(100)
    await nextTick()
    await nextTick()
    const smallRows = countMountedRows(small)

    const large = mountAt(10000)
    await nextTick()
    await nextTick()
    const largeRows = countMountedRows(large)

    // Windowing: mounted rows must be bounded regardless of dataset size.
    // With a 600px viewport / ~44px rows + fixed overscan on both sides, the
    // count is a few dozen — and MUST NOT scale with the 100× larger dataset.
    expect(smallRows).toBeGreaterThan(0)
    expect(smallRows).toBeLessThan(100)
    expect(largeRows).toBeLessThan(100)
    // The visible slice is identical for both (same viewport, same row heights).
    expect(largeRows).toBe(smallRows)
    // And nowhere near the 10000-row dataset.
    expect(largeRows).toBeLessThan(10000)

    small.unmount()
    large.unmount()
  })

  it('keeps the LIVE ResizeObserver count CONSTANT across N=100 vs N=10000', async () => {
    const small = mountAt(100)
    await nextTick()
    await nextTick()
    const smallObservers = roCounter.liveCount()

    small.unmount()
    await nextTick()
    // Symmetric teardown: unmounting disconnects every observer this table owns.
    expect(roCounter.liveCount()).toBe(0)

    const large = mountAt(10000)
    await nextTick()
    await nextTick()
    const largeObservers = roCounter.liveCount()

    // One shared overflow observer + one shared row-height observer + one
    // viewport observer per table: a small, fixed set — NOT O(rows).
    expect(smallObservers).toBeGreaterThan(0)
    expect(smallObservers).toBeLessThan(10)
    expect(largeObservers).toBe(smallObservers)

    large.unmount()
    await nextTick()
    expect(roCounter.liveCount()).toBe(0)
  })
})
