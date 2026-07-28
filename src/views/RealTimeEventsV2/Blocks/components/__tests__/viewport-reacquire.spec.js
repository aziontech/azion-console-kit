/* eslint-disable xss/no-mixed-html -- jsdom test harness: Vue stub templates + layout-spy setup, not HTML sinks */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import VirtualEventTable from '@/views/RealTimeEventsV2/Blocks/components/VirtualEventTable.vue'

/**
 * Regression guard for the viewport-measurement bug (deep-dive ROOT A).
 *
 * The scroll viewport `<div class="virtual-table-viewport">` lives behind the
 * `v-else` of `v-if="isLoading"`. On the first load `isLoading` is true, so the
 * element does NOT exist at onMounted → the ResizeObserver never attaches →
 * `viewportHeight` stays 0. When `isLoading` flips false a FRESH viewport mounts.
 * The fix is a `watch(scrollParentRef)` that re-acquires the observer (and runs
 * syncViewport) against that new element.
 *
 * Without the fix, `viewportHeight` stays 0 and useRowWindow mounts only
 * overscan+1 = 7 rows regardless of the dataset. With the fix, once the viewport
 * mounts and is measured (clientHeight stubbed to 600), the window mounts a
 * viewport-proportional count (≈ 600/44 + overscan ≫ 7). jsdom has no layout,
 * so clientHeight is stubbed; the re-acquire logic itself is what this exercises.
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

let clientHeightSpy, boundingRectSpy
afterEach(() => {
  clientHeightSpy?.mockRestore()
  boundingRectSpy?.mockRestore()
})

const mountTable = (props = {}) =>
  mount(VirtualEventTable, {
    attachTo: document.body,
    props: { data: [], selectedFields: [], getFieldValue, ...props },
    global: {
      stubs: {
        PrimeButton: { template: '<button><slot /></button>' },
        Skeleton: { template: '<div />' },
        EmptyResultsBlock: { template: '<div><slot /></div>' }
      },
      directives: { tooltip: {} }
    }
  })

describe('VirtualEventTable — viewport observer re-acquires after isLoading flips (ROOT A guard)', () => {
  it('mounts a viewport-proportional row count once loading completes (not stuck at overscan)', async () => {
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

    const data = Array.from({ length: 100 }, (item, index) => makeRow(index + 1))
    const wrapper = mountTable({ data, isLoading: true })
    await nextTick()

    // While loading, the viewport is behind v-else → not in the DOM yet.
    expect(wrapper.find('.virtual-table-viewport').exists()).toBe(false)

    // Data lands: the fresh viewport mounts and MUST be re-measured.
    await wrapper.setProps({ isLoading: false })
    await nextTick()
    await nextTick()

    expect(wrapper.find('.virtual-table-viewport').exists()).toBe(true)
    const rows = wrapper.findAll('[data-testid="table-body-row"]')
    // viewportHeight 600 / rowHeight 44 ≈ 14 visible + overscan. The bug froze
    // this at overscan+1 = 7. Assert we are well past that.
    expect(rows.length).toBeGreaterThan(7)

    wrapper.unmount()
  })
})
