import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, KeepAlive, nextTick, ref } from 'vue'
import VirtualEventTable from '../VirtualEventTable.vue'
import { installResizeObserverCounter } from '../../../__tests__/_helpers/measurement.js'

/**
 * H4 probe — keep-alive cleanup symmetry for VirtualEventTable.
 *
 * VirtualEventTable hand-rolls THREE resource lifecycles (viewport RO,
 * row-height RO, column-resize window listeners) plus a nested
 * useOverflowMeasure RO. This test wraps it in <KeepAlive>, drives
 * activate/deactivate cycles, and asserts:
 *   - live ResizeObserver count returns to 0 on deactivate (symmetric release),
 *   - it does not grow across repeated activate/deactivate cycles (no stacking),
 *   - it returns to 0 on final unmount.
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
    offsetX: 0,
    offsetY: 0,
    toJSON: () => {}
  })
}
const restoreLayoutStubs = () => {
  clientHeightSpy?.mockRestore()
  boundingRectSpy?.mockRestore()
}

const stubs = {
  PrimeButton: { template: '<button><slot /></button>' },
  Skeleton: { template: '<div class="skeleton-stub" />' },
  EmptyResultsBlock: { template: '<div class="empty-stub"><slot /></div>' },
  EventDocumentView: { template: '<div class="edv-stub" />' },
  LogFieldBadges: {
    props: ['summary', 'highlightFields', 'searchQuery', 'dataset', 'hiddenCount'],
    template: '<div class="log-field-badges-stub"><div class="log-badges-container" /></div>'
  }
}

const makeHarness = (count) => {
  const show = ref(true)
  const Harness = defineComponent({
    setup() {
      return () =>
        h(KeepAlive, null, {
          default: () =>
            show.value
              ? h(VirtualEventTable, {
                  data: makeData(count),
                  selectedFields: [],
                  getFieldValue
                })
              : null
        })
    }
  })
  const wrapper = mount(Harness, {
    attachTo: document.body,
    global: { stubs, directives: { tooltip: {} } }
  })
  return { wrapper, show }
}

const settle = async () => {
  await nextTick()
  await nextTick()
  await nextTick()
}

describe('VirtualEventTable — H4 keep-alive cleanup symmetry', () => {
  let roCounter
  beforeEach(() => {
    roCounter = installResizeObserverCounter()
    installLayoutStubs()
  })
  afterEach(() => {
    restoreLayoutStubs()
    roCounter.restore()
  })

  it('releases all observers on deactivate and does not stack across activate/deactivate cycles', async () => {
    const { wrapper, show } = makeHarness(10000)
    await settle()

    const activeCount = roCounter.liveCount()
    expect(activeCount).toBeGreaterThan(0)
    expect(activeCount).toBeLessThan(10) // bounded set, not O(rows)

    const cycleActiveCounts = []
    const cycleDeactiveCounts = []

    for (let cycle = 0; cycle < 4; cycle += 1) {
      // deactivate (keep-alive hide)
      show.value = false
      await settle()
      cycleDeactiveCounts.push(roCounter.liveCount())

      // activate (keep-alive show)
      show.value = true
      await settle()
      cycleActiveCounts.push(roCounter.liveCount())
    }

    // Every deactivate must drop live observers back to 0 (symmetric release).
    for (const observed of cycleDeactiveCounts) expect(observed).toBe(0)

    // Every re-activation restores the SAME bounded live count — no growth,
    // no stacked/duplicate observers accumulating across cycles.
    for (const observed of cycleActiveCounts) expect(observed).toBe(activeCount)

    // Final unmount → everything disconnected.
    wrapper.unmount()
    await nextTick()
    expect(roCounter.liveCount()).toBe(0)
  })

  it('peak live observers stay bounded through many cycles (no orphan accumulation)', async () => {
    const { wrapper, show } = makeHarness(10000)
    await settle()
    roCounter.reset()

    for (let cycle = 0; cycle < 6; cycle += 1) {
      show.value = false
      await settle()
      show.value = true
      await settle()
    }

    // Peak simultaneous live observers across all cycles must remain a small
    // fixed set. A stacking leak would make this grow with cycle count.
    expect(roCounter.peakCount()).toBeLessThan(10)

    wrapper.unmount()
    await nextTick()
    expect(roCounter.liveCount()).toBe(0)
  })
})
