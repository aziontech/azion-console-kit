/* eslint-disable xss/no-mixed-html -- jsdom test harness: Vue stub templates + layout-spy setup, not HTML sinks */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import VirtualEventTable from '@/views/RealTimeEventsV2/Blocks/components/VirtualEventTable.vue'

// ─── Task 15.1 (regression guard) ─────────────────────────────────────────────
// The Document column (rendered when `selectedFields` is empty) must show the
// actual field badges — key AND value — not just an empty cell. Fase 1 only
// covered sort/expand/select, which let a blank Document column ship. This
// asserts the CONTENT (the field key:value text), and would catch a drop-in
// that bound the row wrapper (`item.summary`) instead of `item.row.summary`.

const VIEWPORT_HEIGHT = 600
const ROW_HEIGHT = 44

const makeRow = (id) => ({
  id,
  ts: id,
  tsFormat: `2024-01-01T00:00:${String(id % 60).padStart(2, '0')}Z`,
  summary: [
    { key: 'host', value: `host-${id}.example.com` },
    { key: 'status', value: 200 },
    { key: 'requestMethod', value: 'GET' }
  ]
})

const getFieldValue = (row, key) => {
  const fieldName = key.replace('field_', '')
  const entry = row.summary?.find((item) => item.key === fieldName)
  return entry ? String(entry.value) : '-'
}

let clientHeightSpy, boundingRectSpy
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
  boundingRectSpy?.mockRestore()
})

describe('VirtualEventTable — Document column content (task 15.1)', () => {
  it('renders a Document column when no fields are selected', async () => {
    installLayoutStubs()
    const wrapper = mountTable()
    await nextTick()
    await nextTick()
    expect(wrapper.findAll('th.col-document').length).toBe(1)
    expect(wrapper.findAll('td.col-document').length).toBe(2)
  })

  it('renders the actual field badges (keys AND values) in the Document column', async () => {
    installLayoutStubs()
    const wrapper = mountTable()
    await nextTick()
    await nextTick()

    const badgeValues = wrapper.findAll('.log-badge__value')
    // 2 rows × 3 summary fields = 6 value badges.
    expect(badgeValues.length).toBe(6)

    const firstDoc = wrapper.findAll('td.col-document')[0]
    const text = firstDoc.text()
    // The key:value content must actually be present — not a blank cell.
    expect(text).toContain('host')
    expect(text).toContain('host-1.example.com')
    expect(text).toContain('status')
    expect(text).toContain('200')
    expect(text).toContain('requestMethod')
    expect(text).toContain('GET')
  })

  it('does NOT render the Document column when fields are selected', async () => {
    installLayoutStubs()
    const wrapper = mountTable({ selectedFields: ['host'] })
    await nextTick()
    await nextTick()
    expect(wrapper.findAll('td.col-document').length).toBe(0)
  })
})
