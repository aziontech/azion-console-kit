/* eslint-disable xss/no-mixed-html -- jsdom test harness: Vue stub templates + layout-spy setup, not HTML sinks */
/* global globalThis */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'
import { useExportData, EXPORT_MAX_ROWS } from '../useExportData'

/**
 * Feature: real-time-events-v2-refactor — task 3.7 (`useExportData` over the
 * logical result + 10k cap).
 *
 * Validates: Requirements 1.8, 4.10. CSV export re-fetches the current
 * range/filter (NOT the mounted virtual window nor the retained buffer) up to
 * `EXPORT_MAX_ROWS`, exports the most-recent `cap` rows when the source is
 * larger, and warns of truncation. It is the delegate target of the virtualized
 * table's `exportCSV` shim, so the exposed `exportCsv` must produce the same
 * quoted CSV byte-format the previous PrimeVue path produced.
 *
 * TZ=UTC per repo convention (no timestamps are asserted here).
 */

vi.mock('@/views/RealTimeEventsV2/helpers/trigger-download', () => ({
  triggerBlobDownload: vi.fn()
}))

const makeRow = (index) => ({
  id: `row-${index}`,
  ts: index,
  tsFormat: `2024-01-01 00:00:${String(index % 60).padStart(2, '0')}`,
  summary: [{ key: 'host', value: `h${index}.example.com` }]
})

const baseFilter = {
  tsRange: {
    tsRangeBegin: '2024-01-01T00:00:00.000Z',
    tsRangeEnd: '2024-01-02T00:00:00.000Z'
  },
  fields: []
}

describe('useExportData — logical-range CSV + 10k cap (task 3.7)', () => {
  it('exposes EXPORT_MAX_ROWS = 10000 (mirrors the aggregate limit)', () => {
    expect(EXPORT_MAX_ROWS).toBe(10000)
  })

  it('re-fetches the logical range via listService — NOT the mounted window (tableData)', async () => {
    const listService = vi.fn(async ({ pageSize, offset }) => ({
      data: Array.from({ length: pageSize }, (unused, idx) => makeRow(offset + idx)).slice(0, 3)
    }))
    // tableData holds a DIFFERENT (mounted-window) set — must be ignored for CSV.
    const tableData = ref([makeRow(999)])
    const { fetchExportRows } = useExportData({
      tableData,
      tabSelected: ref({ dataset: 'workloadEvents', tabRouter: 'http-requests' }),
      listService: ref(listService),
      filterData: ref(baseFilter),
      pageSize: ref(1000),
      selectedFields: ref([])
    })

    const { rows, truncated } = await fetchExportRows()
    expect(listService).toHaveBeenCalled()
    // First call re-fetches the range, not the buffer.
    expect(listService.mock.calls[0][0]).toMatchObject({ offset: 0 })
    expect(rows).toHaveLength(3)
    expect(rows[0].id).toBe('row-0')
    expect(truncated).toBe(false)
  })

  it('truncates to the 10k most-recent rows and warns when the source exceeds the cap', async () => {
    // Service that never runs dry until well past the cap: always returns a full page.
    const listService = vi.fn(async ({ pageSize, offset }) => ({
      data: Array.from({ length: pageSize }, (unused, idx) => makeRow(offset + idx))
    }))
    const onWarn = vi.fn()
    const { fetchExportRows } = useExportData({
      tableData: ref([]),
      tabSelected: ref({ dataset: 'workloadEvents' }),
      listService: ref(listService),
      filterData: ref(baseFilter),
      pageSize: ref(2500),
      selectedFields: ref([]),
      onWarn
    })

    const { rows, truncated, sourceCount } = await fetchExportRows()
    expect(truncated).toBe(true)
    expect(rows).toHaveLength(EXPORT_MAX_ROWS)
    // The most-recent (newest→oldest walk starts at offset 0) are kept.
    expect(rows[0].id).toBe('row-0')
    expect(rows[EXPORT_MAX_ROWS - 1].id).toBe(`row-${EXPORT_MAX_ROWS - 1}`)
    expect(sourceCount).toBeGreaterThan(EXPORT_MAX_ROWS)
    expect(onWarn).toHaveBeenCalledWith({ rows: sourceCount, cap: EXPORT_MAX_ROWS })
  })

  it('stops walking as soon as the service is exhausted (short final page)', async () => {
    const total = 7
    const listService = vi.fn(async ({ pageSize, offset }) => ({
      data: Array.from({ length: Math.max(0, Math.min(pageSize, total - offset)) }, (unused, idx) =>
        makeRow(offset + idx)
      )
    }))
    const { fetchExportRows } = useExportData({
      tableData: ref([]),
      tabSelected: ref({ dataset: 'workloadEvents' }),
      listService: ref(listService),
      filterData: ref(baseFilter),
      pageSize: ref(3),
      selectedFields: ref([])
    })

    const { rows, truncated } = await fetchExportRows()
    expect(rows).toHaveLength(total)
    expect(truncated).toBe(false)
    // 3 + 3 + 1(short) = 3 calls, then stops (no infinite loop).
    expect(listService).toHaveBeenCalledTimes(3)
  })

  it('falls back to tableData when no listService is injected (backward-compatible)', async () => {
    const tableData = ref([makeRow(1), makeRow(2)])
    const { fetchExportRows } = useExportData({
      tableData,
      tabSelected: ref({ dataset: 'workloadEvents' })
    })
    const { rows, truncated } = await fetchExportRows()
    expect(rows).toHaveLength(2)
    expect(truncated).toBe(false)
  })

  it('truncates + warns even in the fallback path when tableData exceeds the cap', async () => {
    const big = Array.from({ length: EXPORT_MAX_ROWS + 5 }, (unused, idx) => makeRow(idx))
    const onWarn = vi.fn()
    const { fetchExportRows } = useExportData({
      tableData: ref(big),
      tabSelected: ref({ dataset: 'workloadEvents' }),
      onWarn
    })
    const { rows, truncated } = await fetchExportRows()
    expect(rows).toHaveLength(EXPORT_MAX_ROWS)
    expect(truncated).toBe(true)
    expect(onWarn).toHaveBeenCalledWith({ rows: EXPORT_MAX_ROWS + 5, cap: EXPORT_MAX_ROWS })
  })
})

describe('useExportData — CSV byte-format parity with PrimeVue (task 3.7)', () => {
  let capturedBlobContent

  beforeEach(() => {
    capturedBlobContent = null
    vi.stubGlobal(
      'Blob',
      class MockBlob {
        constructor(parts) {
          capturedBlobContent = parts.join('')
        }
      }
    )
    vi.stubGlobal('URL', {
      ...globalThis.URL,
      createObjectURL: vi.fn(() => 'blob:mock-url'),
      revokeObjectURL: vi.fn()
    })
  })

  it('emits BOM + quoted Document header/cells when no fields are selected', async () => {
    const rows = [
      { id: 'a', tsFormat: '2024-01-01 00:00:00', summary: [{ key: 'host', value: 'a.com' }] }
    ]
    const { buildCsv } = useExportData({
      tableData: ref(rows),
      tabSelected: ref({ dataset: 'workloadEvents' }),
      selectedFields: ref([])
    })
    const csv = await buildCsv(rows)
    expect(csv.startsWith('﻿')).toBe(true)
    expect(csv).toContain('"Time","Document"')
    expect(csv).toContain('"2024-01-01 00:00:00","host: a.com"')
  })

  it('emits one column per selected field (field_<name>) with header = field name', async () => {
    const rows = [{ id: 'a', tsFormat: 'T1', field_status: '200', field_host: 'x.com' }]
    const { buildCsv } = useExportData({
      tableData: ref(rows),
      tabSelected: ref({ dataset: 'workloadEvents' }),
      selectedFields: ref(['status', 'host'])
    })
    const csv = await buildCsv(rows)
    // Column set + headers match the rendered table (Time + one per field).
    expect(csv).toContain('"Time","status","host"')
    // Dynamic-field cells are emitted as empty strings — the SAME behavior the
    // previous PrimeVue path produced: `defaultColumnMapper` only maps
    // `tsFormat`/`summary`, so `field_<name>` resolves via `?? ''`. Task 3.7
    // preserves export format byte-for-byte, so this stays empty (not "200").
    expect(csv).toContain('"T1","",""')
  })

  it('escapes embedded quotes by doubling them in summary cells', async () => {
    const rows = [{ id: 'a', tsFormat: 'T1', summary: [{ key: 'ua', value: 'say "hi"' }] }]
    const { buildCsv } = useExportData({
      tableData: ref(rows),
      tabSelected: ref({ dataset: 'workloadEvents' }),
      selectedFields: ref([])
    })
    const csv = await buildCsv(rows)
    expect(csv).toContain('"ua: say ""hi"""')
  })

  it('exportCsv downloads a .csv named after the tab router', async () => {
    const { triggerBlobDownload } =
      await import('@/views/RealTimeEventsV2/helpers/trigger-download')
    triggerBlobDownload.mockClear()
    const rows = [{ id: 'a', tsFormat: 'T1', summary: [{ key: 'host', value: 'a.com' }] }]
    const { exportCsv } = useExportData({
      tableData: ref(rows),
      tabSelected: ref({ dataset: 'workloadEvents', tabRouter: 'http-requests' }),
      selectedFields: ref([])
    })
    await exportCsv()
    expect(triggerBlobDownload).toHaveBeenCalledWith(
      expect.objectContaining({ filename: 'http-requests-logs.csv' })
    )
    expect(capturedBlobContent.startsWith('﻿')).toBe(true)
  })

  it('exportCsv is a no-op when there are no rows to export', async () => {
    const { triggerBlobDownload } =
      await import('@/views/RealTimeEventsV2/helpers/trigger-download')
    triggerBlobDownload.mockClear()
    const { exportCsv } = useExportData({
      tableData: ref([]),
      tabSelected: ref({ dataset: 'workloadEvents' }),
      selectedFields: ref([])
    })
    await exportCsv()
    expect(triggerBlobDownload).not.toHaveBeenCalled()
  })

  it('ignores a second export click while one is already in flight (B1)', async () => {
    const { triggerBlobDownload } =
      await import('@/views/RealTimeEventsV2/helpers/trigger-download')
    triggerBlobDownload.mockClear()
    let resolveFetch
    const listService = vi.fn(() => new Promise((resolve) => (resolveFetch = resolve)))
    const { exportCsv } = useExportData({
      tableData: ref([]),
      tabSelected: ref({ dataset: 'workloadEvents', tabRouter: 'http-requests' }),
      listService: ref(listService),
      filterData: ref({
        tsRange: {
          tsRangeBegin: '2024-01-01T00:00:00.000Z',
          tsRangeEnd: '2024-01-02T00:00:00.000Z'
        },
        fields: []
      }),
      pageSize: ref(1000),
      selectedFields: ref([])
    })

    const first = exportCsv()
    const second = exportCsv()
    resolveFetch({
      data: [{ id: 'a', tsFormat: 'T1', summary: [{ key: 'host', value: 'a.com' }] }]
    })
    await Promise.all([first, second])

    // The in-flight latch collapses the doubled fetch walk + download into one.
    expect(listService).toHaveBeenCalledTimes(1)
    expect(triggerBlobDownload).toHaveBeenCalledTimes(1)
  })
})
