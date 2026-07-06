import { ref, unref } from 'vue'
import { defaultColumnMapper } from '@/views/RealTimeEventsV2/Blocks/constants/tabs-events'
import { triggerBlobDownload } from '@/views/RealTimeEventsV2/helpers/trigger-download'

/**
 * Hard ceiling for an export. Mirrors the aggregate `limit: 10000` used by the
 * count query (design §2.1(9)/§11 Open Question — export). The export operates
 * over the LOGICAL result (re-fetched range/filter), NOT the mounted virtual
 * window nor the possibly-evicted retained buffer; if the logical result has
 * more than this many rows, the 10k most-recent are exported and the caller is
 * warned of truncation.
 */
export const EXPORT_MAX_ROWS = 10000

/**
 * Read a value that may be a ref, a getter, or a plain value.
 * @template T
 * @param {import('vue').Ref<T> | (() => T) | T} source
 * @returns {T}
 */
const read = (source) => (typeof source === 'function' ? source() : unref(source))

/**
 * PrimeVue's exportCSV wraps every field in double quotes and escapes embedded
 * quotes by doubling them, joins cells with the separator and rows with `\n`,
 * and prepends a UTF-8 BOM. We reproduce that byte-format here because the CSV
 * path no longer goes through the PrimeVue DataTable instance (the virtualized
 * table owns its own `<table>`), and the exported file must stay identical to
 * what users got before (design §3.3 — preserve export column/format behavior).
 */
const CSV_SEPARATOR = ','
const CSV_BOM = '﻿'

/** Rows serialized per slice before yielding the main thread (B2). */
const EXPORT_CHUNK_SIZE = 1000
const JSON_INDENT = '  '

/** Yields to the event loop so a large export never freezes the UI. */
const yieldToMain = () => new Promise((resolve) => setTimeout(resolve, 0))

/**
 * Describes the exportable columns in the SAME order the table renders them
 * (VirtualEventTable.vue): the "Time" column (`tsFormat`), one column per
 * selected field (`field_<name>`), and — only when no fields are selected — the
 * "Document" column (`summary`). The chevron column has no `field`, so it was
 * never exportable; we omit it too.
 *
 * @param {string[]} selectedFields
 * @returns {Array<{ field: string, header: string }>}
 */
const buildExportColumns = (selectedFields) => {
  const columns = [{ field: 'tsFormat', header: 'Time' }]
  if (Array.isArray(selectedFields) && selectedFields.length > 0) {
    for (const name of selectedFields) {
      columns.push({ field: `field_${name}`, header: name })
    }
  } else {
    columns.push({ field: 'summary', header: 'Document' })
  }
  return columns
}

const quoteCsvCell = (value) => `"${value}"`

/**
 * Composable for table data export (CSV and JSON).
 *
 * CSV export operates over the LOGICAL result set: when a `listService` +
 * `filterData` are injected it re-fetches the current range/filter up to
 * `EXPORT_MAX_ROWS` (newest→oldest), independent of the mounted virtual window
 * or the retained buffer. Without a `listService` (backward-compatible usage /
 * unit tests) it falls back to the provided `tableData`. It is the delegate
 * target of the virtualized table's `exportCSV` compatibility shim: the table
 * exposes `{ dataTableRef, exportCSV }` where `exportCSV` calls this
 * composable's `exportCsv` (design §2.1(9)/§3.3, task 3.7).
 *
 * @param {Object} options
 * @param {import('vue').Ref<Array>} options.tableData
 *   Reactive retained rows — the JSON export source and the CSV fallback when no
 *   `listService` is injected.
 * @param {import('vue').ComputedRef<Object>} options.tabSelected
 *   Current tab/dataset config (drives filenames).
 * @param {import('vue').Ref<Function> | Function} [options.listService]
 *   The list transport (same shape as `useEventsData`'s): called
 *   `(filterWithPaging, { onQuery }) => { data: Row[] }`. When present, CSV
 *   export re-fetches the logical range instead of reading `tableData`.
 * @param {import('vue').Ref<Object> | (() => Object)} [options.filterData]
 *   Current filter (range + fields); the re-fetch range source.
 * @param {import('vue').Ref<number> | (() => number)} [options.pageSize]
 *   Page size for the re-fetch walk (defaults to `EXPORT_MAX_ROWS` in one shot).
 * @param {import('vue').Ref<string[]> | (() => string[])} [options.selectedFields]
 *   Currently selected fields — decides the CSV columns (matches the table).
 * @param {(warning: { rows: number, cap: number }) => void} [options.onWarn]
 *   Invoked when the logical result exceeded `EXPORT_MAX_ROWS` and the export
 *   was truncated to the most-recent `cap` rows.
 */
export function useExportData({
  tableData,
  tabSelected,
  listService,
  filterData,
  pageSize,
  selectedFields,
  onWarn = () => {}
}) {
  const dataTableRef = ref(null)
  const exportMenuRef = ref(null)
  const exporting = ref(false)

  const toggleExportMenu = (event) => exportMenuRef.value?.toggle(event)

  const exportFunctionMapper = (rowData) => {
    const mappedRow = defaultColumnMapper(rowData)
    if (rowData.field === 'summary') {
      mappedRow.summary = [...mappedRow.summary]
        .map(
          (summaryItem) => `${summaryItem.key}: ${String(summaryItem.value).replace(/"/g, '""')}`
        )
        .join(' | ')
    }
    return mappedRow[rowData.field] ?? ''
  }

  /**
   * Re-fetches the current range/filter up to `EXPORT_MAX_ROWS`, newest→oldest.
   * Returns the rows plus whether the source was truncated. Falls back to the
   * retained `tableData` when no `listService`/`filterData` is injected so
   * legacy callers (and unit tests) keep working.
   *
   * @returns {Promise<{ rows: Array, truncated: boolean, sourceCount: number }>}
   */
  const fetchExportRows = async () => {
    const service = read(listService)
    const filter = read(filterData)

    if (typeof service !== 'function' || !filter?.tsRange) {
      const fallback = Array.isArray(tableData.value) ? tableData.value : []
      const truncated = fallback.length > EXPORT_MAX_ROWS
      const rows = truncated ? fallback.slice(0, EXPORT_MAX_ROWS) : fallback
      if (truncated) onWarn({ rows: fallback.length, cap: EXPORT_MAX_ROWS })
      return { rows, truncated, sourceCount: fallback.length }
    }

    // Walk newest→oldest until we hit the cap or the source is exhausted. One
    // extra row past the cap is enough to know the result was truncated without
    // materializing the whole (potentially huge) result set.
    const step = Math.max(1, Math.trunc(read(pageSize) || EXPORT_MAX_ROWS))
    const collected = []
    let offset = 0
    let exhausted = false
    while (collected.length <= EXPORT_MAX_ROWS && !exhausted) {
      const remaining = EXPORT_MAX_ROWS + 1 - collected.length
      const target = Math.min(step, remaining)
      const response = await service({ ...filter, pageSize: target, offset })
      const batch = Array.isArray(response?.data) ? response.data : []
      collected.push(...batch)
      offset += batch.length
      if (batch.length < target) exhausted = true
    }

    const truncated = collected.length > EXPORT_MAX_ROWS
    const rows = truncated ? collected.slice(0, EXPORT_MAX_ROWS) : collected
    if (truncated) onWarn({ rows: collected.length, cap: EXPORT_MAX_ROWS })
    return { rows, truncated, sourceCount: collected.length }
  }

  const serializeCsvRow = (record, columns) =>
    columns
      .map((column) => {
        const cellData = record?.[column.field]
        if (cellData == null) return quoteCsvCell('')
        return quoteCsvCell(exportFunctionMapper({ data: cellData, field: column.field }))
      })
      .join(CSV_SEPARATOR)

  /**
   * Builds the CSV string for `rows`, byte-identical to the previous PrimeVue
   * export (BOM + quoted header row + quoted body cells, `\n`-separated).
   * Serialized in `EXPORT_CHUNK_SIZE` slices, yielding between them (B2).
   * @param {Array} rows
   * @returns {Promise<string>}
   */
  const buildCsv = async (rows) => {
    const columns = buildExportColumns(read(selectedFields))
    const header = columns.map((column) => quoteCsvCell(column.header)).join(CSV_SEPARATOR)
    const chunks = []
    for (let start = 0; start < rows.length; start += EXPORT_CHUNK_SIZE) {
      const slice = rows.slice(start, start + EXPORT_CHUNK_SIZE)
      chunks.push(slice.map((record) => serializeCsvRow(record, columns)).join('\n'))
      if (start + EXPORT_CHUNK_SIZE < rows.length) await yieldToMain()
    }
    const body = chunks.join('\n')
    return `${CSV_BOM}${header}${body ? `\n${body}` : ''}`
  }

  /** Re-indents a per-row stringify by one level so it nests inside the array. */
  const indentJsonRow = (row) =>
    JSON.stringify(row, null, 2)
      .split('\n')
      .map((line) => JSON_INDENT + line)
      .join('\n')

  /**
   * Builds the pretty JSON array, byte-identical to `JSON.stringify(rows, null, 2)`,
   * stringifying per-row in `EXPORT_CHUNK_SIZE` slices and yielding between them (B2).
   * @param {Array} rows
   * @returns {Promise<string>}
   */
  const buildJson = async (rows) => {
    if (!rows.length) return '[]'
    const chunks = []
    for (let start = 0; start < rows.length; start += EXPORT_CHUNK_SIZE) {
      const slice = rows.slice(start, start + EXPORT_CHUNK_SIZE)
      chunks.push(slice.map(indentJsonRow).join(',\n'))
      if (start + EXPORT_CHUNK_SIZE < rows.length) await yieldToMain()
    }
    return `[\n${chunks.join(',\n')}\n]`
  }

  /**
   * CSV export command / shim delegate target: re-fetches the logical range
   * (≤ `EXPORT_MAX_ROWS`), builds the CSV and downloads. No-op when empty or
   * when another export is already in flight (B1).
   */
  const exportCsv = async () => {
    if (exporting.value) return
    exporting.value = true
    try {
      const { rows } = await fetchExportRows()
      if (!rows.length) return
      const csv = await buildCsv(rows)
      const blob = new Blob([csv], { type: 'application/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      triggerBlobDownload({
        url,
        filename: `${read(tabSelected)?.tabRouter || read(tabSelected)?.dataset || 'events'}-logs.csv`
      })
    } finally {
      exporting.value = false
    }
  }

  /**
   * JSON export command: builds the pretty JSON from the retained rows and
   * downloads. No-op when empty or when another export is in flight (B1).
   */
  const exportJson = async () => {
    if (exporting.value) return
    const rows = Array.isArray(tableData.value) ? tableData.value : []
    if (!rows.length) return
    exporting.value = true
    try {
      const json = await buildJson(rows)
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      triggerBlobDownload({
        url,
        filename: `${read(tabSelected)?.dataset || 'events'}-export.json`
      })
    } finally {
      exporting.value = false
    }
  }

  const exportMenuItems = ref([
    {
      label: 'Export as CSV',
      icon: 'pi pi-file',
      command: () => {
        exportCsv().catch(() => {})
      }
    },
    {
      label: 'Export as JSON',
      icon: 'pi pi-code',
      command: () => {
        exportJson().catch(() => {})
      }
    }
  ])

  return {
    dataTableRef,
    exportMenuRef,
    toggleExportMenu,
    exportMenuItems,
    exportFunctionMapper,
    exportCsv,
    exportJson,
    fetchExportRows,
    buildCsv,
    buildJson
  }
}
