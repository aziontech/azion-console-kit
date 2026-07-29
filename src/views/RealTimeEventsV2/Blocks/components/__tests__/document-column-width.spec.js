/* eslint-disable xss/no-mixed-html -- jsdom test harness: Vue stub templates + layout-spy setup, not HTML sinks */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import VirtualEventTable from '@/views/RealTimeEventsV2/Blocks/components/VirtualEventTable.vue'

// Repro for S3 (Document column visually blank). jsdom does NOT lay out tables
// (no table-layout:fixed algorithm, getBoundingClientRect stubbed), so we cannot
// assert the RENDERED pixel width here. What we CAN pin is the ROOT-CAUSE seam:
// the Document <th> declares only `min-width` and NO `width`, while the table is
// `table-layout: fixed`. Under fixed layout min/max-width on cells are ignored,
// so this column has no authoritative width and collapses to leftover space
// (→ ~0 when the flex width chain is narrow). This test documents that seam.

const VIEWPORT_HEIGHT = 600
const ROW_HEIGHT = 44

const makeRow = (id) => ({
  id,
  ts: id,
  tsFormat: `t${id}`,
  summary: [
    { key: 'host', value: `host-${id}.example.com` },
    { key: 'status', value: 200 }
  ]
})
const getFieldValue = (row, key) => {
  const fieldName = key.replace('field_', '')
  const entry = row.summary?.find((item) => item.key === fieldName)
  return entry ? String(entry.value) : '-'
}

let clientHeightSpy, rectSpy
const installLayoutStubs = () => {
  clientHeightSpy = vi
    .spyOn(HTMLElement.prototype, 'clientHeight', 'get')
    .mockReturnValue(VIEWPORT_HEIGHT)
  rectSpy = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
    width: 800,
    height: ROW_HEIGHT,
    top: 0,
    left: 0,
    right: 800,
    bottom: ROW_HEIGHT,
    toJSON: () => {}
  })
}

const mountTable = (props = {}) =>
  mount(VirtualEventTable, {
    attachTo: document.body,
    props: { data: [makeRow(1), makeRow(2)], selectedFields: [], getFieldValue, ...props },
    global: {
      stubs: {
        PrimeButton: { template: '<button><slot /></button>' },
        Skeleton: { template: '<div />' },
        EmptyResultsBlock: { template: '<div><slot /></div>' }
      },
      directives: { tooltip: {} }
    }
  })

afterEach(() => {
  clientHeightSpy?.mockRestore()
  rectSpy?.mockRestore()
})

describe('S3 root-cause seam — Document column has no authoritative width', () => {
  it('table is table-layout:fixed but the Document <th> sets only min-width (no width)', async () => {
    installLayoutStubs()
    const wrapper = mountTable()
    await nextTick()
    await nextTick()

    const th = wrapper.find('th.col-document')
    expect(th.exists()).toBe(true)
    const style = th.attributes('style') || ''

    // The bug seam: min-width present, width ABSENT. Under table-layout:fixed,
    // min-width on a cell is ignored → column width = leftover only.
    expect(style).toContain('min-width')
    expect(style).not.toMatch(/(^|[^-])width:/) // no `width:` (only `min-width:`)
  })

  it('fixed columns (chevron + time) DO carry explicit width — so only Document collapses', async () => {
    installLayoutStubs()
    const wrapper = mountTable()
    await nextTick()
    await nextTick()

    const chevron = wrapper.find('th.col-chevron').attributes('style') || ''
    const time = wrapper.find('th.col-time').attributes('style') || ''
    expect(chevron).toMatch(/width:\s*2\.5rem/)
    expect(time).toMatch(/width:\s*185px/)
  })

  it('spacer/expansion colspans equal the REAL column count (never 1000 phantom columns)', async () => {
    // Root cause of the fullscreen "Document blank": colspan=1000 made
    // table-layout:fixed count 1000 columns, so ~998 phantom auto columns split
    // the width with Document (~1.7px each) and the badges were clipped.
    installLayoutStubs()
    const wrapper = mountTable()
    await nextTick()
    await nextTick()

    const spacerCells = wrapper.findAll('td.virtual-spacer-cell')
    for (const cell of spacerCells) {
      // chevron + time + document = 3 columns in Document mode.
      expect(Number(cell.attributes('colspan'))).toBe(3)
    }
  })

  it('badges ARE in the DOM (blank is layout, not data)', async () => {
    installLayoutStubs()
    const wrapper = mountTable()
    await nextTick()
    await nextTick()
    // 2 rows x 2 fields = 4 value badges present in the DOM.
    expect(wrapper.findAll('.log-badge__value').length).toBe(4)
  })
})
