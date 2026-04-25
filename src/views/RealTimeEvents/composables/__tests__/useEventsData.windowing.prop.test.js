import { describe, it, expect, vi } from 'vitest'
import { ref } from 'vue'
import fc from 'fast-check'
import { useEventsData } from '../useEventsData.js'

/**
 * Feature: real-time-events-refactor, Property 6: Temporal windowing correctness
 *
 * Validates: Requirements 9.1
 *
 * For any time range where (tsRangeEnd - tsRangeBegin) > 2 hours, the
 * useEventsData loader splits the range into sequential windows of at most
 * 2 hours each, fetching from newest to oldest. For ranges ≤ 2 hours, no
 * windowing is applied.
 */

const TWO_HOURS_MS = 2 * 60 * 60 * 1000

// ── Generators ──

/**
 * Generate a time range that is strictly > 2 hours (long range → windowing).
 * Range: from 2h+1min up to 48h.
 */
const arbLongRange = fc
  .integer({ min: TWO_HOURS_MS + 60_000, max: 48 * 60 * 60 * 1000 })
  .map((durationMs) => {
    const end = Date.now()
    const begin = end - durationMs
    return {
      tsRangeBegin: new Date(begin).toISOString(),
      tsRangeEnd: new Date(end).toISOString(),
      beginMs: begin,
      endMs: end,
      durationMs
    }
  })

/**
 * Generate a time range that is ≤ 2 hours (short range → no windowing).
 * Range: from 1 minute up to exactly 2 hours.
 */
const arbShortRange = fc
  .integer({ min: 60_000, max: TWO_HOURS_MS })
  .map((durationMs) => {
    const end = Date.now()
    const begin = end - durationMs
    return {
      tsRangeBegin: new Date(begin).toISOString(),
      tsRangeEnd: new Date(end).toISOString(),
      beginMs: begin,
      endMs: end,
      durationMs
    }
  })

const arbPageSize = fc.integer({ min: 3, max: 15 })

/**
 * Create a useEventsData instance with a tracking listService that records
 * the tsRange of every call made to it. Each call returns exactly 1 row
 * so the loader must iterate through all windows to fill the page.
 */
function createTrackedEventsData(range, pageSize) {
  const calls = []

  const mockListService = vi.fn(async (params) => {
    calls.push({
      tsRangeBegin: params.tsRange?.tsRangeBegin,
      tsRangeEnd: params.tsRange?.tsRangeEnd,
      offset: params.offset,
      pageSize: params.pageSize
    })
    // Return 0 rows so the windowed loop advances through all windows
    return { data: [] }
  })

  const instance = useEventsData({
    filterData: ref({
      tsRange: {
        tsRangeBegin: range.tsRangeBegin,
        tsRangeEnd: range.tsRangeEnd
      },
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

  return { instance, calls, mockListService }
}

// ── Tests ──

describe('Feature: real-time-events-refactor, Property 6: Temporal windowing correctness', () => {
  it('ranges > 2h are split into sequential ≤2h windows from newest to oldest', async () => {
    await fc.assert(
      fc.asyncProperty(arbLongRange, arbPageSize, async (range, pageSize) => {
        const { instance, calls } = createTrackedEventsData(range, pageSize)

        await instance.load()

        // For long ranges, windowing must be applied — at least 2 calls
        expect(calls.length).toBeGreaterThanOrEqual(2)

        // Verify each window is ≤ 2 hours
        for (const call of calls) {
          const wBegin = new Date(call.tsRangeBegin).getTime()
          const wEnd = new Date(call.tsRangeEnd).getTime()
          const windowDuration = wEnd - wBegin
          expect(windowDuration).toBeLessThanOrEqual(TWO_HOURS_MS)
          expect(windowDuration).toBeGreaterThan(0)
        }

        // Verify windows are sequential from newest to oldest:
        // Each window's end should equal the previous window's begin
        for (let i = 1; i < calls.length; i++) {
          const prevBegin = new Date(calls[i - 1].tsRangeBegin).getTime()
          const currEnd = new Date(calls[i].tsRangeEnd).getTime()
          expect(currEnd).toBe(prevBegin)
        }

        // First window's end should be the original range end
        const firstEnd = new Date(calls[0].tsRangeEnd).getTime()
        expect(firstEnd).toBe(range.endMs)

        // Last window's begin should be the original range begin
        const lastBegin = new Date(calls[calls.length - 1].tsRangeBegin).getTime()
        expect(lastBegin).toBe(range.beginMs)
      }),
      { numRuns: 100 }
    )
  })

  it('ranges ≤ 2h use the original filter without windowing', async () => {
    await fc.assert(
      fc.asyncProperty(arbShortRange, arbPageSize, async (range, pageSize) => {
        const { instance, calls } = createTrackedEventsData(range, pageSize)

        await instance.load()

        // For short ranges, exactly 1 call with the original tsRange
        expect(calls.length).toBe(1)

        const call = calls[0]
        expect(call.tsRangeBegin).toBe(range.tsRangeBegin)
        expect(call.tsRangeEnd).toBe(range.tsRangeEnd)
      }),
      { numRuns: 100 }
    )
  })

  it('windows cover the entire original range without gaps or overlaps', async () => {
    await fc.assert(
      fc.asyncProperty(arbLongRange, arbPageSize, async (range, pageSize) => {
        const { instance, calls } = createTrackedEventsData(range, pageSize)

        await instance.load()

        // The union of all windows should exactly cover [beginMs, endMs]
        // Since windows are sequential (each end = prev begin), we just
        // need to verify the first end and last begin match the original range
        const firstEnd = new Date(calls[0].tsRangeEnd).getTime()
        const lastBegin = new Date(calls[calls.length - 1].tsRangeBegin).getTime()

        expect(firstEnd).toBe(range.endMs)
        expect(lastBegin).toBe(range.beginMs)

        // Verify contiguity: no gaps between windows
        for (let i = 1; i < calls.length; i++) {
          const prevBegin = new Date(calls[i - 1].tsRangeBegin).getTime()
          const currEnd = new Date(calls[i].tsRangeEnd).getTime()
          expect(currEnd).toBe(prevBegin)
        }
      }),
      { numRuns: 100 }
    )
  })

  it('number of windows equals ceil(durationMs / 2h) for long ranges', async () => {
    await fc.assert(
      fc.asyncProperty(arbLongRange, arbPageSize, async (range, pageSize) => {
        const { instance, calls } = createTrackedEventsData(range, pageSize)

        await instance.load()

        const expectedWindows = Math.ceil(range.durationMs / TWO_HOURS_MS)
        expect(calls.length).toBe(expectedWindows)
      }),
      { numRuns: 100 }
    )
  })
})
