/* global globalThis */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import fc from 'fast-check'
import { ref } from 'vue'
import { useExportData } from '../useExportData'

/**
 * Feature: real-time-events-refactor, Property 13: Export output determinism
 *
 * Validates: Requirements 13.7, 9.5
 *
 * For any tableData array and tab configuration, the JSON export produces
 * output equal to JSON.stringify(tableData, null, 2), and the CSV export
 * produces identical output for the same input data.
 */

vi.mock('@/views/RealTimeEventsV2/helpers/trigger-download', () => ({
  triggerBlobDownload: vi.fn()
}))

// ── Generators ──

const arbSummaryItem = fc.record({
  // eslint-disable-next-line id-length
  key: fc.string({ minLength: 1, maxLength: 20 }).filter((s) => s.trim().length > 0),
  value: fc.oneof(
    fc.string({ minLength: 0, maxLength: 50 }),
    fc.integer({ min: -10000, max: 10000 }),
    fc.double({ min: -1000, max: 1000, noNaN: true, noDefaultInfinity: true })
  )
})

const arbTableRow = fc.record({
  id: fc.uuid(),
  // `fc.date()` may yield `Invalid Date` unless `noInvalidDate: true` is set;
  // calling `.toISOString()` on an invalid Date throws `RangeError: Invalid
  // time value`. Pin to a finite calendar window and exclude invalid dates
  // so the arbitrary always produces a valid ISO string.
  ts: fc
    .date({
      min: new Date('2020-01-01T00:00:00.000Z'),
      max: new Date('2030-01-01T00:00:00.000Z'),
      noInvalidDate: true
    })
    // eslint-disable-next-line id-length
    .filter((d) => Number.isFinite(d.getTime()))
    // eslint-disable-next-line id-length
    .map((d) => d.toISOString()),
  tsFormat: fc.string({ minLength: 5, maxLength: 30 }),
  summary: fc.array(arbSummaryItem, { minLength: 1, maxLength: 8 })
})

const arbTableData = fc.array(arbTableRow, { minLength: 1, maxLength: 20 })

const arbDataset = fc.constantFrom(
  'httpEvents',
  'l2CacheEvents',
  'edgeFunctionsEvents',
  'edgeFunctionsConsoleEvents',
  'imageProcessorEvents',
  'tieredCacheEvents',
  'edgeDnsEvents',
  'dataStreamedEvents'
)

describe('Feature: real-time-events-refactor, Property 13: Export output determinism', () => {
  let capturedBlobContent

  beforeEach(() => {
    capturedBlobContent = null

    // Mock Blob to capture the content passed to it
    vi.stubGlobal(
      'Blob',
      class MockBlob {
        constructor(parts, options) {
          this._parts = parts
          this._options = options
          capturedBlobContent = parts.join('')
        }
      }
    )

    // Mock URL.createObjectURL / revokeObjectURL
    vi.stubGlobal('URL', {
      ...globalThis.URL,
      createObjectURL: vi.fn(() => 'blob:mock-url'),
      revokeObjectURL: vi.fn()
    })
  })

  it('JSON export blob content equals JSON.stringify(tableData, null, 2) for any tableData', async () => {
    await fc.assert(
      fc.asyncProperty(arbTableData, arbDataset, async (rows, dataset) => {
        const tableData = ref(rows)
        const tabSelected = ref({ dataset })

        const { exportJson } = useExportData({ tableData, tabSelected })

        // Chunked/async JSON export must stay byte-identical to JSON.stringify.
        await exportJson()

        const expected = JSON.stringify(rows, null, 2)
        expect(capturedBlobContent).toBe(expected)
      }),
      { numRuns: 100 }
    )
  })

  it('JSON export produces identical output for the same input across two invocations', async () => {
    await fc.assert(
      fc.asyncProperty(arbTableData, arbDataset, async (rows, dataset) => {
        const tableData = ref(rows)
        const tabSelected = ref({ dataset })

        const { exportJson } = useExportData({ tableData, tabSelected })

        await exportJson()
        const firstOutput = capturedBlobContent

        await exportJson()
        const secondOutput = capturedBlobContent

        expect(firstOutput).toBe(secondOutput)
      }),
      { numRuns: 100 }
    )
  })

  it('JSON export skips when tableData is empty', async () => {
    const tableData = ref([])
    const tabSelected = ref({ dataset: 'httpEvents' })

    const { exportJson } = useExportData({ tableData, tabSelected })

    await exportJson()

    // Blob should not have been created for empty data
    expect(capturedBlobContent).toBeNull()
  })
})
