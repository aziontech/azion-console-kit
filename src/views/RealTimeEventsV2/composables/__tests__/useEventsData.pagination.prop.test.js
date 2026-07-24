import { describe, it, expect, vi } from 'vitest'
import { ref } from 'vue'
import fc from 'fast-check'
import { useEventsData } from '../useEventsData.js'

/**
 * Feature: real-time-events-refactor, Property 11: loadMore pagination and row ordering
 *
 * Validates: Requirements 13.5, 13.10
 *
 * For any sequence of load() followed by N loadMore() calls, the resulting
 * tableData contains rows in descending timestamp order (newest first),
 * no duplicate rows, no gaps, and the expected total length. Pagination
 * descends by ts CURSOR (shrinking tsRangeEnd) instead of `offset`, so the
 * mock serves rows by tsRange — exactly like the real API.
 */

// ── Generators ──

const arbPageSize = fc.integer({ min: 5, max: 20 })
const arbNumLoadMoreCalls = fc.integer({ min: 0, max: 4 })

/**
 * Build a dataset of rows with descending timestamps.
 * Row i has timestamp (baseTime - i*1000ms), so row 0 is newest.
 */
function buildDescendingRows(totalRows, baseTime) {
  const rows = []
  // eslint-disable-next-line id-length
  for (let i = 0; i < totalRows; i++) {
    const ts = new Date(baseTime - i * 1000).toISOString()
    rows.push({
      id: `row-${i}`,
      ts,
      tsFormat: ts,
      summary: [
        { key: 'id', value: `row-${i}` },
        { key: 'ts', value: ts }
      ]
    })
  }
  return rows
}

/**
 * Mock listService that serves pages by tsRange (inclusive on BOTH ends — the
 * worst case for boundary duplicates, which the cursor's dedupe must absorb)
 * plus optional offset, mirroring the real API surface.
 */
function createMockListService(allRows) {
  return vi.fn(async (params) => {
    const begin = new Date(params.tsRange.tsRangeBegin).getTime()
    const end = new Date(params.tsRange.tsRangeEnd).getTime()
    const inRange = allRows.filter((row) => {
      const tsMs = new Date(row.ts).getTime()
      return tsMs >= begin && tsMs <= end
    })
    const offset = params.offset || 0
    const size = params.pageSize || 10
    return { data: inRange.slice(offset, offset + size) }
  })
}

/**
 * Helper to create a useEventsData instance with a short-range filter
 * (≤ 2 hours) so it uses the single-segment cursor-paging path. Rows are
 * built 1 minute in the past so every row falls inside the range.
 */
function createEventsDataForPagination(allRows, pageSize) {
  const now = Date.now()
  const begin = new Date(now - 60 * 60 * 1000).toISOString() // 1 hour ago
  const end = new Date(now).toISOString()

  const mockListService = createMockListService(allRows)
  const totalRowCount = allRows.length

  const instance = useEventsData({
    filterData: ref({
      tsRange: { tsRangeBegin: begin, tsRangeEnd: end },
      fields: []
    }),
    listService: ref(mockListService),
    loadChartAggregation: ref(null),
    tabSelected: ref({ dataset: 'test' }),
    pageSize: ref(pageSize),
    hasChartConfig: ref(false),
    onError: vi.fn(),
    locale: 'en-US'
  })

  return { instance, mockListService, totalRowCount }
}

const rowBaseTime = () => Date.now() - 60_000

// ── Tests ──

describe('Feature: real-time-events-refactor, Property 11: loadMore pagination and row ordering', () => {
  it('after load() + N loadMore() calls, tableData has descending timestamps, no duplicates, and correct length', async () => {
    await fc.assert(
      fc.asyncProperty(arbPageSize, arbNumLoadMoreCalls, async (pageSize, numLoadMore) => {
        const totalPages = 1 + numLoadMore
        const totalAvailableRows = pageSize * (totalPages + 1)
        const allRows = buildDescendingRows(totalAvailableRows, rowBaseTime())

        const { instance, totalRowCount } = createEventsDataForPagination(allRows, pageSize)

        // Initial load
        await instance.load()

        // Simulate chart aggregation reporting the real total count.
        // In production, loadChartAggregation calls setRecordsFound.
        // This makes hasMoreData true so loadMore() proceeds.
        instance.setRecordsFound(totalRowCount)
        instance.hasMoreData.value = true

        // Perform N loadMore calls
        // eslint-disable-next-line id-length
        for (let i = 0; i < numLoadMore; i++) {
          if (!instance.hasMoreData.value) break
          await instance.loadMore()
        }

        const rows = instance.tableData.value

        // ── Property: correct total length ──
        const expectedLength = Math.min(pageSize * totalPages, totalAvailableRows)
        expect(rows.length).toBe(expectedLength)

        // ── Property: descending timestamp order ──
        // eslint-disable-next-line id-length
        for (let i = 1; i < rows.length; i++) {
          const prevTs = new Date(rows[i - 1].ts).getTime()
          const currTs = new Date(rows[i].ts).getTime()
          expect(prevTs).toBeGreaterThanOrEqual(currTs)
        }

        // ── Property: no duplicate rows ──
        // eslint-disable-next-line id-length
        const ids = rows.map((r) => r.id)
        const uniqueIds = new Set(ids)
        expect(uniqueIds.size).toBe(rows.length)

        // ── Property: no gaps (consecutive rows from the dataset) ──
        // eslint-disable-next-line id-length
        for (let i = 0; i < rows.length; i++) {
          expect(rows[i].id).toBe(`row-${i}`)
        }
      }),
      { numRuns: 100 }
    )
  })

  it('loadMore REPLACES the tableData array reference (never mutates in place)', async () => {
    // Regression lock: prop-crossing consumers (FieldSidebar field stats) only
    // re-run when the array identity changes. An in-place push + triggerRef kept
    // the prop identical and froze the stats at the first page.
    const pageSize = 10
    const allRows = buildDescendingRows(pageSize * 3, rowBaseTime())
    const { instance, totalRowCount } = createEventsDataForPagination(allRows, pageSize)

    await instance.load()
    instance.setRecordsFound(totalRowCount)
    instance.hasMoreData.value = true

    const firstPageRef = instance.tableData.value
    await instance.loadMore()

    expect(instance.tableData.value).not.toBe(firstPageRef)
    expect(instance.tableData.value.length).toBe(pageSize * 2)
    expect(firstPageRef.length).toBe(pageSize)
  })

  it('pagination descends by ts cursor: no offset for distinct-ts data, tsRangeEnd never grows', async () => {
    await fc.assert(
      fc.asyncProperty(arbPageSize, arbNumLoadMoreCalls, async (pageSize, numLoadMore) => {
        const totalPages = 1 + numLoadMore
        const totalAvailableRows = pageSize * (totalPages + 1)
        const allRows = buildDescendingRows(totalAvailableRows, rowBaseTime())

        const { instance, mockListService } = createEventsDataForPagination(allRows, pageSize)

        await instance.load()
        instance.setRecordsFound(totalAvailableRows)
        instance.hasMoreData.value = true

        // eslint-disable-next-line id-length
        for (let i = 0; i < numLoadMore; i++) {
          if (!instance.hasMoreData.value) break
          await instance.loadMore()
        }

        const calls = mockListService.mock.calls.map(([params]) => params)

        // Distinct-ts data never needs the offset fallback: every page is pure
        // cursor descent (this is the index-friendly property under test).
        for (const call of calls) {
          expect(call.offset).toBeUndefined()
        }

        // The cursor only moves toward the past: tsRangeEnd is non-increasing.
        // eslint-disable-next-line id-length
        for (let i = 1; i < calls.length; i++) {
          const prevEnd = new Date(calls[i - 1].tsRange.tsRangeEnd).getTime()
          const currEnd = new Date(calls[i].tsRange.tsRangeEnd).getTime()
          expect(currEnd).toBeLessThanOrEqual(prevEnd)
        }
      }),
      { numRuns: 100 }
    )
  })

  it('an instant holding more rows than a page falls back to offset paging without loss or duplication', async () => {
    // > pageSize rows sharing ONE timestamp: the cursor cannot advance past the
    // instant, so the engine must switch to offset paging WITHIN the segment
    // (legacy semantics as bounded worst case) and still deliver every row once.
    const pageSize = 10
    const sharedTs = new Date(Date.now() - 60_000).toISOString()
    const allRows = Array.from({ length: pageSize * 3 }, (_unused, idx) => ({
      id: `same-${idx}`,
      ts: sharedTs,
      tsFormat: sharedTs,
      summary: [{ key: 'id', value: `same-${idx}` }]
    }))

    const { instance, mockListService } = createEventsDataForPagination(allRows, pageSize)

    await instance.load()
    instance.hasMoreData.value = true
    await instance.loadMore()
    instance.hasMoreData.value = true
    await instance.loadMore()

    const ids = instance.tableData.value.map((row) => row.id)
    expect(ids).toHaveLength(pageSize * 3)
    expect(new Set(ids).size).toBe(pageSize * 3)
    // The offset fallback actually engaged (at least one server-side skip).
    expect(mockListService.mock.calls.some(([params]) => (params.offset || 0) > 0)).toBe(true)
  })
})
