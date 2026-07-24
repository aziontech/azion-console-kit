import { describe, it, expect } from 'vitest'
import { ref, nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import { useRowWindow } from '../useRowWindow.js'
import VirtualEventTable from '../../Blocks/components/VirtualEventTable.vue'

const makeRows = (count) =>
  Array.from({ length: count }, (_unused, idx) => ({
    id: `row-${idx}`,
    ts: 1000 + idx,
    tsFormat: `t${idx}`,
    summary: [{ key: 'host', value: `h${idx}` }]
  }))

describe('S1: windowing renders too few rows when viewportHeight ~ 0', () => {
  it('with 100 logical rows + viewportHeight=0, only overscan+1 rows mount', () => {
    const logicalRows = ref(makeRows(100))
    const scrollTop = ref(0)
    const viewportHeight = ref(0) // collapsed height chain

    const { windowedRows, bottomSpacer } = useRowWindow({
      logicalRows,
      scrollTop,
      viewportHeight,
      estimatedRowHeight: 44,
      overscan: 6,
      keyOf: (row) => row.id
    })

    // 100 rows in the dataset, but the window mounts only ~7 (overscan+1).
    expect(logicalRows.value.length).toBe(100)
    expect(windowedRows.value.length).toBe(7)
    // The remaining height is pushed into the bottom spacer (data IS there).
    expect(bottomSpacer.value).toBe((100 - 7) * 44)
  })

  it('control: a real viewportHeight mounts many rows', async () => {
    const logicalRows = ref(makeRows(100))
    const scrollTop = ref(0)
    const viewportHeight = ref(600) // healthy height chain

    const { windowedRows } = useRowWindow({
      logicalRows,
      scrollTop,
      viewportHeight,
      estimatedRowHeight: 44,
      overscan: 6,
      keyOf: (row) => row.id
    })

    // 600 / 44 ~= 13 visible + overscan → ~20. Definitely far more than 7.
    expect(windowedRows.value.length).toBeGreaterThan(15)
  })
})

describe('S2: scrolling the viewport never triggers loadMore (no wiring)', () => {
  it('VirtualEventTable declares no load-more emit and does not emit on scroll', async () => {
    const wrapper = mount(VirtualEventTable, {
      props: {
        data: makeRows(100),
        selectedFields: [],
        getFieldValue: () => '-',
        isLoading: false
      },
      global: {
        stubs: {
          LogFieldBadges: true,
          EventDocumentView: true,
          PrimeButton: true,
          Skeleton: true,
          EmptyResultsBlock: true
        }
      }
    })
    await nextTick()

    const viewport = wrapper.find('.virtual-table-viewport')
    expect(viewport.exists()).toBe(true)

    // Simulate a scroll to the very bottom of the viewport.
    Object.defineProperty(viewport.element, 'scrollTop', {
      value: 100000,
      writable: true,
      configurable: true
    })
    Object.defineProperty(viewport.element, 'clientHeight', { value: 0, configurable: true })
    await viewport.trigger('scroll')
    await nextTick()

    // There is NO scroll->loadMore mechanism: the component emits nothing
    // resembling a load-more request. loadMore is button-only (LoadMoreFooter).
    const emitted = wrapper.emitted()
    expect(emitted['load-more']).toBeUndefined()
    expect(emitted['loadMore']).toBeUndefined()
    expect(emitted['load-more-data']).toBeUndefined()
  })
})
