import { describe, it, expect, vi, beforeEach } from 'vitest'
import fc from 'fast-check'

/**
 * Feature: real-time-events-refactor, Property 8: In-place row mutation preserves identity
 *
 * Validates: Requirements 12.2
 *
 * For any row object returned by the service layer, wrapServiceWithCompactTimestamp
 * SHALL add the tsFormat property to the same object reference (in-place mutation),
 * not create a new object. Object.is(originalRow, wrappedRow) SHALL be true.
 */

const mockListHttpRequest = vi.fn()

vi.mock('@/services/real-time-events-service', () => ({
  listHttpRequest: (...args) => mockListHttpRequest(...args),
  listEdgeFunctions: vi.fn(),
  listEdgeFunctionsConsole: vi.fn(),
  listActivityHistory: vi.fn(),
  listDataStream: vi.fn(),
  listEdgeDNS: vi.fn(),
  listImageProcessor: vi.fn(),
  listTieredCache: vi.fn(),
  loadEventsChartAggregation: vi.fn(),
  loadActivityHistory: vi.fn(),
  loadEdgeFunctions: vi.fn(),
  loadEdgeFunctionsConsole: vi.fn(),
  loadDataStream: vi.fn(),
  loadEdgeDNS: vi.fn(),
  loadImageProcessor: vi.fn(),
  loadTieredCache: vi.fn()
}))

vi.mock('@stores/account', () => ({
  useAccountStore: () => ({
    accountData: { timezone: 'UTC' }
  })
}))

vi.mock('../../helpers/format-timestamp', () => ({
  formatTimestampCompact: (time, _tz) => `formatted:${time}`
}))

// Arbitrary: ISO 8601 timestamp strings (use integer-based generation to avoid invalid dates)
const arbTimestamp = fc
  .integer({ min: 946684800000, max: 1924991999000 }) // 2000-01-01 to 2030-12-31 in ms
  .map((ms) => new Date(ms).toISOString())

// Arbitrary: row object with a `ts` field and random extra properties
const arbRow = fc
  .record({
    ts: arbTimestamp,
    id: fc.string({ minLength: 1, maxLength: 10 })
  })
  .map(({ ts, id }) => ({ ts, id }))

// Arbitrary: non-empty array of rows
const arbRows = fc.array(arbRow, { minLength: 1, maxLength: 50 })

describe('Feature: real-time-events-refactor, Property 8: In-place row mutation preserves identity', () => {
  let listHttpRequest

  beforeEach(async () => {
    vi.clearAllMocks()
    const mod = await import('../index.js')
    listHttpRequest = mod.listHttpRequest
  })

  it('Object.is(originalRow, wrappedRow) is true for every row after wrapping', async () => {
    await fc.assert(
      fc.asyncProperty(arbRows, async (rows) => {
        // Store references to the original row objects before the wrapper touches them
        const originalRefs = rows.map((row) => row)

        mockListHttpRequest.mockResolvedValueOnce({ data: rows })

        const result = await listHttpRequest()

        // Every returned row must be the exact same object reference
        for (let i = 0; i < originalRefs.length; i++) {
          expect(Object.is(originalRefs[i], result.data[i])).toBe(true)
        }
      }),
      { numRuns: 100 }
    )
  })

  it('tsFormat property is added in-place to each row that has a ts field', async () => {
    await fc.assert(
      fc.asyncProperty(arbRows, async (rows) => {
        mockListHttpRequest.mockResolvedValueOnce({ data: rows })

        const result = await listHttpRequest()

        for (const row of result.data) {
          expect(row).toHaveProperty('tsFormat')
          expect(row.tsFormat).toBe(`formatted:${row.ts}`)
        }
      }),
      { numRuns: 100 }
    )
  })

  it('row count is preserved after wrapping', async () => {
    await fc.assert(
      fc.asyncProperty(arbRows, async (rows) => {
        const originalLength = rows.length
        mockListHttpRequest.mockResolvedValueOnce({ data: rows })

        const result = await listHttpRequest()

        expect(result.data.length).toBe(originalLength)
      }),
      { numRuns: 100 }
    )
  })
})
