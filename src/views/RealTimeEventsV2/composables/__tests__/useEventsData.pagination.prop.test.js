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
 * no duplicate rows, no gaps, and tableData.length equals the sum of all
 * fetched page sizes (or fewer if the dataset is exhausted).
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
 * Create a mock listService that serves pages from a pre-built dataset
 * using offset-based pagination.
 */
function createMockListService(allRows) {
  return vi.fn(async (params) => {
    const offset = params.offset || 0
    const size = params.pageSize || 10
    const page = allRows.slice(offset, offset + size)
    return { data: page }
  })
}

/**
 * Helper to create a useEventsData instance with a short-range filter
 * (≤ 2 hours) so it uses the simple offset-based pagination path.
 *
 * The loadChartAggregation mock resolves immediately and calls
 * setRecordsFound with the real total, mimicking the production flow
 * where the chart aggregation reports the total row count.
 */
function createEventsDataForPagination(allRows, pageSize) {
  const now = Date.now()
  const begin = new Date(now - 60 * 60 * 1000).toISOString() // 1 hour ago
  const end = new Date(now).toISOString()

  const mockListService = createMockListService(allRows)
  const totalRowCount = allRows.length

  // We'll capture setRecordsFound to call it after load
  let setRecordsFoundFn = null

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

// ── Tests ──

describe('Feature: real-time-events-refactor, Property 11: loadMore pagination and row ordering', () => {
  it('after load() + N loadMore() calls, tableData has descending timestamps, no duplicates, and correct length', async () => {
    await fc.assert(
      fc.asyncProperty(arbPageSize, arbNumLoadMoreCalls, async (pageSize, numLoadMore) => {
        const totalPages = 1 + numLoadMore
        const totalAvailableRows = pageSize * (totalPages + 1)
        const baseTime = Date.now()
        const allRows = buildDescendingRows(totalAvailableRows, baseTime)

        const { instance, totalRowCount } = createEventsDataForPagination(allRows, pageSize)

        // Initial load
        await instance.load()

        // Simulate chart aggregation reporting the real total count.
        // In production, loadChartAggregation calls setRecordsFound.
        // This makes hasMoreData true so loadMore() proceeds.
        instance.setRecordsFound(totalRowCount)
        instance.hasMoreData.value = true

        // Perform N loadMore calls
        for (let i = 0; i < numLoadMore; i++) {
          if (!instance.hasMoreData.value) break
          await instance.loadMore()
        }

        const rows = instance.tableData.value

        // ── Property: correct total length ──
        const expectedLength = Math.min(pageSize * totalPages, totalAvailableRows)
        expect(rows.length).toBe(expectedLength)

        // ── Property: descending timestamp order ──
        for (let i = 1; i < rows.length; i++) {
          const prevTs = new Date(rows[i - 1].ts).getTime()
          const currTs = new Date(rows[i].ts).getTime()
          expect(prevTs).toBeGreaterThanOrEqual(currTs)
        }

        // ── Property: no duplicate rows ──
        const ids = rows.map((r) => r.id)
        const uniqueIds = new Set(ids)
        expect(uniqueIds.size).toBe(rows.length)

        // ── Property: no gaps (consecutive rows from the dataset) ──
        for (let i = 0; i < rows.length; i++) {
          expect(rows[i].id).toBe(`row-${i}`)
        }
      }),
      { numRuns: 100 }
    )
  })

  it('loadMore does not re-fetch already loaded rows (no offset regression)', async () => {
    await fc.assert(
      fc.asyncProperty(arbPageSize, arbNumLoadMoreCalls, async (pageSize, numLoadMore) => {
        const totalPages = 1 + numLoadMore
        const totalAvailableRows = pageSize * (totalPages + 1)
        const baseTime = Date.now()
        const allRows = buildDescendingRows(totalAvailableRows, baseTime)

        const { instance, mockListService, totalRowCount } = createEventsDataForPagination(
          allRows,
          pageSize
        )

        await instance.load()
        instance.setRecordsFound(totalRowCount)
        instance.hasMoreData.value = true

        const callsAfterLoad = mockListService.mock.calls.length

        for (let i = 0; i < numLoadMore; i++) {
          if (!instance.hasMoreData.value) break
          await instance.loadMore()
        }

        // Verify offsets are sequential and non-overlapping
        const allCallArgs = mockListService.mock.calls
        const offsets = allCallArgs.map((call) => call[0].offset || 0)

        // First call (from load) should be offset 0
        expect(offsets[0]).toBe(0)

        // Subsequent calls should have strictly increasing offsets
        for (let i = 1; i < offsets.length; i++) {
          expect(offsets[i]).toBeGreaterThan(offsets[i - 1])
        }
      }),
      { numRuns: 100 }
    )
  })

  it('tableData length equals sum of individual page sizes returned', async () => {
    await fc.assert(
      fc.asyncProperty(arbPageSize, arbNumLoadMoreCalls, async (pageSize, numLoadMore) => {
        const totalPages = 1 + numLoadMore
        const totalAvailableRows = pageSize * (totalPages + 1)
        const baseTime = Date.now()
        const allRows = buildDescendingRows(totalAvailableRows, baseTime)

        // Track individual page sizes returned by the mock
        const pageSizesReturned = []
        const trackingService = vi.fn(async (params) => {
          const offset = params.offset || 0
          const size = params.pageSize || 10
          const page = allRows.slice(offset, offset + size)
          pageSizesReturned.push(page.length)
          return { data: page }
        })

        const now = Date.now()
        const begin = new Date(now - 60 * 60 * 1000).toISOString()
        const end = new Date(now).toISOString()

        const instance = useEventsData({
          filterData: ref({
            tsRange: { tsRangeBegin: begin, tsRangeEnd: end },
            fields: []
          }),
          listService: ref(trackingService),
          loadChartAggregation: ref(null),
          tabSelected: ref({ dataset: 'test' }),
          pageSize: ref(pageSize),
          hasChartConfig: ref(false),
          onError: vi.fn(),
          locale: 'en-US'
        })

        await instance.load()
        instance.setRecordsFound(totalAvailableRows)
        instance.hasMoreData.value = true

        for (let i = 0; i < numLoadMore; i++) {
          if (!instance.hasMoreData.value) break
          await instance.loadMore()
        }

        // tableData.length should equal the sum of all page sizes returned
        const sumOfPages = pageSizesReturned.reduce((sum, s) => sum + s, 0)
        expect(instance.tableData.value.length).toBe(sumOfPages)
      }),
      { numRuns: 100 }
    )
  })
})
