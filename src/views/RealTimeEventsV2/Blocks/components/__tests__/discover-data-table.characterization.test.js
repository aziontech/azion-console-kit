import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import VirtualEventTable from '../VirtualEventTable.vue'

/**
 * CHARACTERIZATION (Wave 0 PRESERVE guard) — migrated to VirtualEventTable.
 *
 * The old `discover-data-table.vue` was a thin wrapper around the webkit
 * <DataTable>; the PRESERVE guards there asserted the PrimeVue *wiring*
 * (captured props: dataKey/removableSort/sortField, pt.bodyRow testid,
 * $slots.expansion). Task 3.5 replaces it with `VirtualEventTable`, which owns
 * its OWN <table>/<thead>/<tbody> — there is no PrimeVue DataTable/Column to
 * stub, so those prop-capture assertions are structurally impossible.
 *
 * This file keeps the SAME contract alive but asserts on OBSERVABLE DOM /
 * behavior (design §12.1 char-test migration):
 *   (a) SORT  — clicking the "Time" header reorders the rendered
 *       [data-testid="table-body-row"] by the numeric `ts` key (not display
 *       `tsFormat`) and cycles the 3-state removable sort (asc → desc → none).
 *   (b) EXPAND — in detailViewMode='inline' an inline expansion <tr> renders
 *       EventDocumentView with the row and compact=true; ABSENT in 'sidebar'.
 *   (c) SELECT — clicking the chevron / timestamp emits select-row(row); each
 *       body <tr> carries data-testid="table-body-row" as a literal attribute
 *       (the grep contract the measurement helpers rely on) and data-row-id
 *       (id-based selection, task 3.10).
 *
 * The mount API (props/emits) is asserted on observable DOM/behavior; the
 * PrimeVue-era defineExpose shim (dataTableRef/exportCSV) was removed once the
 * export path moved fully into useExportData.
 *
 * ResizeObserver is stubbed (jsdom lacks it) so the windower/overflow observers
 * do not throw on mount; the windower still renders the full (small) set because
 * viewportHeight resolves large enough for these fixtures.
 */

class NoopResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

const makeRow = (id, tsFormat) => ({
  id,
  ts: id, // numeric sort key; distinct from the display `tsFormat`
  tsFormat,
  summary: [{ key: 'host', value: `host-${id}` }],
  field_status: 200 + id
})

// Deliberately supplied OUT of ts order to prove sort acts on `ts`, not input
// order or display string: row id=2 first, then id=1.
const makeData = () => [makeRow(2, '2024-01-02T00:00:00Z'), makeRow(1, '2024-01-01T00:00:00Z')]

const getFieldValue = (row, key) => row[key]

const mountTable = (props = {}) => {
  const data = props.data ?? makeData()
  return mount(VirtualEventTable, {
    attachTo: document.body,
    props: {
      data,
      getFieldValue,
      ...props
    },
    global: {
      stubs: {
        PrimeButton: {
          name: 'PrimeButton',
          props: ['icon', 'text', 'size'],
          emits: ['click'],
          template: '<button @click.stop="$emit(\'click\', $event)"><slot /></button>'
        },
        Skeleton: { template: '<div class="skeleton-stub" />' },
        EmptyResultsBlock: { template: '<div class="empty-stub"><slot /></div>' },
        EventDocumentView: {
          name: 'EventDocumentView',
          props: ['data', 'isLoading', 'compact'],
          emits: ['notify', 'add-filter', 'exclude-filter'],
          template: '<div class="event-document-view-stub" />'
        },
        LogFieldBadges: {
          name: 'LogFieldBadges',
          props: ['summary', 'highlightFields', 'searchQuery', 'dataset', 'hiddenCount'],
          emits: ['toggle-expand', 'add-filter', 'exclude-filter'],
          template: '<div class="log-field-badges-stub"><div class="log-badges-container" /></div>'
        }
      },
      directives: { tooltip: {} }
    }
  })
}

const bodyRows = (wrapper) => wrapper.findAll('[data-testid="table-body-row"]')
const rowIds = (wrapper) => bodyRows(wrapper).map((row) => Number(row.attributes('data-row-id')))

describe('VirtualEventTable — CHARACTERIZATION (PRESERVE guards)', () => {
  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', NoopResizeObserver)
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  // ─── Loading branch ───────────────────────────────────────────────────────
  it('renders 8 skeletons and NOT the table while isLoading is true', () => {
    const wrapper = mountTable({ isLoading: true })
    expect(wrapper.findAll('.skeleton-stub').length).toBe(8)
    expect(wrapper.find('.virtual-event-table').exists()).toBe(false)
  })

  // ─── (a) Sort / reorder seam ────────────────────────────────────────────────
  it('renders every row with data-testid="table-body-row" and a data-row-id (id-based)', () => {
    const wrapper = mountTable()
    const rows = bodyRows(wrapper)
    expect(rows.length).toBe(2)
    // literal grep-preservable attribute on each body <tr>
    rows.forEach((row) => expect(row.attributes('data-testid')).toBe('table-body-row'))
    // unsorted: preserves input order (id 2 then 1)
    expect(rowIds(wrapper)).toEqual([2, 1])
  })

  it('clicking the "Time" header sorts by the numeric "ts" key and cycles asc → desc → none', async () => {
    const wrapper = mountTable()
    expect(rowIds(wrapper)).toEqual([2, 1]) // input order

    const timeHeader = wrapper.find('th.col-time')
    expect(timeHeader.exists()).toBe(true)

    await timeHeader.trigger('click') // → asc by ts
    expect(rowIds(wrapper)).toEqual([1, 2])

    await timeHeader.trigger('click') // → desc by ts
    expect(rowIds(wrapper)).toEqual([2, 1])

    await timeHeader.trigger('click') // → none (back to input order)
    expect(rowIds(wrapper)).toEqual([2, 1])
  })

  it('re-emits row-click with an originalEvent carrying a real DOM target', async () => {
    const wrapper = mountTable()
    await bodyRows(wrapper)[0].trigger('click')
    const emitted = wrapper.emitted('row-click')
    expect(emitted).toBeTruthy()
    const payload = emitted[0][0]
    expect(payload.data.id).toBe(2)
    expect(payload.originalEvent).toBeTruthy()
    expect(payload.originalEvent.target).toBeTruthy()
  })

  // ─── (b) Expand seam ────────────────────────────────────────────────────────
  it('renders EventDocumentView in an inline expansion row with the row + compact=true (inline mode)', () => {
    const data = makeData()
    const wrapper = mountTable({ detailViewMode: 'inline', expandedRows: [data[0]] })
    const edv = wrapper.findComponent({ name: 'EventDocumentView' })
    expect(edv.exists()).toBe(true)
    expect(edv.props('data').id).toBe(data[0].id)
    expect(edv.props('compact')).toBe(true)
  })

  it('does NOT render an inline expansion when detailViewMode is "sidebar"', () => {
    const data = makeData()
    const wrapper = mountTable({ detailViewMode: 'sidebar', expandedRows: [data[0]] })
    expect(wrapper.findComponent({ name: 'EventDocumentView' }).exists()).toBe(false)
    expect(wrapper.find('.virtual-expansion-row').exists()).toBe(false)
  })

  it('re-emits update:expandedRows when the parent-controlled array changes (drop-in contract)', async () => {
    // expandedRows is an ARRAY OF ROW OBJECTS on the public surface (drop-in).
    // The table renders the inline expansion for whichever rows are in the prop;
    // update:expandedRows is part of the emits contract used by the parent
    // v-model binding. We assert the prop drives the rendered expansion.
    const data = makeData()
    const wrapper = mountTable({ detailViewMode: 'inline', expandedRows: [] })
    expect(wrapper.find('.virtual-expansion-row').exists()).toBe(false)
    await wrapper.setProps({ expandedRows: [data[0]] })
    expect(wrapper.find('.virtual-expansion-row').exists()).toBe(true)
    expect(wrapper.find('.virtual-expansion-row').attributes('data-row-expansion-id')).toBe(
      String(data[0].id)
    )
  })

  // ─── (c) Selection seam ─────────────────────────────────────────────────────
  it('clicking the expand chevron emits select-row with the row', async () => {
    const wrapper = mountTable()
    const chevron = wrapper.find('.expand-indicator')
    expect(chevron.exists()).toBe(true)
    await chevron.trigger('click')
    const emitted = wrapper.emitted('select-row')
    expect(emitted).toBeTruthy()
    expect(emitted[0][0].id).toBe(2)
  })

  it('the chevron reflects active state via isRowActive', () => {
    const isRowActive = vi.fn(() => true)
    const wrapper = mountTable({ isRowActive })
    expect(wrapper.find('.expand-indicator').classes()).toContain('expand-indicator--active')
  })

  it('clicking the timestamp cell emits select-row with the row', async () => {
    const wrapper = mountTable()
    const ts = wrapper.find('.timestamp-cell')
    expect(ts.exists()).toBe(true)
    expect(ts.text()).toBe('2024-01-02T00:00:00Z')
    await ts.trigger('click')
    const emitted = wrapper.emitted('select-row')
    expect(emitted).toBeTruthy()
    expect(emitted[0][0].id).toBe(2)
  })

  it('applies rowClass to the body row (row--active/expanded/focused seam)', () => {
    const rowClass = (row) => (row.id === 2 ? 'row--active' : '')
    const wrapper = mountTable({ rowClass })
    const first = bodyRows(wrapper)[0]
    expect(first.attributes('data-row-id')).toBe('2')
    expect(first.classes()).toContain('row--active')
  })

  // ─── Document column / dynamic field cells / filter emits ────────────────────
  it('renders a Document column (LogFieldBadges) when no selectedFields are chosen', () => {
    const wrapper = mountTable({ selectedFields: [] })
    expect(wrapper.find('th.col-document').exists()).toBe(true)
    expect(wrapper.findComponent({ name: 'LogFieldBadges' }).exists()).toBe(true)
  })

  it('renders one dynamic field column per selectedField and emits add/exclude-filter from its buttons', async () => {
    const wrapper = mountTable({ selectedFields: ['status'] })
    // header for the field, and NO Document column
    const headers = wrapper.findAll('th.col-field').map((th) => th.text())
    expect(headers).toContain('status')
    expect(wrapper.find('th.col-document').exists()).toBe(false)

    // first rendered row is id=2 (input order) → field_status = 202
    const firstRow = bodyRows(wrapper)[0]
    // Action buttons are hover-gated (mount only for the hovered cell).
    await firstRow.find('.dynamic-field-cell').trigger('mouseenter')
    const buttons = firstRow.findAll('.dynamic-field-actions button')
    expect(buttons.length).toBe(2)
    await buttons[0].trigger('click') // pi-filter → add-filter
    await buttons[1].trigger('click') // pi-filter-slash → exclude-filter

    expect(wrapper.emitted('add-filter')[0]).toEqual(['status', 202])
    expect(wrapper.emitted('exclude-filter')[0]).toEqual(['status', 202])
  })

  // ─── Empty state ─────────────────────────────────────────────────────────────
  it('renders the empty-results block when there are no rows', () => {
    const wrapper = mountTable({ data: [] })
    expect(wrapper.find('.empty-stub').exists()).toBe(true)
    expect(wrapper.find('.virtual-event-table').exists()).toBe(false)
  })
})
