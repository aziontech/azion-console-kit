import { describe, it, expect, vi } from 'vitest'
import { ref, nextTick } from 'vue'
import fc from 'fast-check'

// Mock Vue lifecycle hooks since we're testing outside a component
vi.mock('vue', async () => {
  const actual = await vi.importActual('vue')
  return {
    ...actual,
    onBeforeUnmount: vi.fn(),
    onDeactivated: vi.fn()
  }
})

import { useFieldResolution } from '../useFieldResolution.js'
import { useDocumentSearch } from '../useDocumentSearch.js'
import { useFieldStats } from '../useFieldStats.js'

/**
 * Feature: real-time-events-refactor, Property 7: Incremental computed update correctness
 *
 * Validates: Requirements 10.1, 10.2, 10.3, 10.8
 *
 * For any initial tableData of size N followed by a loadMore append of k rows,
 * availableFieldOptions, searchIndex, and fieldStats produce results identical
 * to full recomputation over all N+k rows.
 */

// ── Generators ──

const FIELD_CHARS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_'

const arbFieldKey = fc
  .array(fc.constantFrom(...FIELD_CHARS.split('')), { minLength: 1, maxLength: 12 })
  .map((chars) => chars.join(''))

const arbFieldValue = fc.oneof(
  fc
    .array(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789 '.split('')), {
      minLength: 1,
      maxLength: 20
    })
    .map((chars) => chars.join('')),
  fc.integer({ min: 0, max: 9999 }).map(String)
)

const arbSummaryEntry = fc.record({
  key: arbFieldKey,
  value: arbFieldValue
})

const arbRow = fc
  .array(arbSummaryEntry, { minLength: 1, maxLength: 6 })
  .map((summary) => ({ summary }))

const arbInitialData = fc.array(arbRow, { minLength: 0, maxLength: 15 })
const arbAppendData = fc.array(arbRow, { minLength: 1, maxLength: 10 })

// ── Helpers ──

function setupFieldResolution(tableData) {
  return useFieldResolution({
    filterFields: ref([]),
    liveDatasetFields: ref([]),
    selectedFields: ref([]),
    tableData
  })
}

function setupFieldStats(tableData) {
  return useFieldStats({
    data: tableData,
    availableFields: ref([]),
    searchQuery: ref(''),
    selectedFields: ref([])
  })
}


// ── Tests ──

describe('Feature: real-time-events-refactor, Property 7: Incremental computed update correctness', () => {
  describe('useFieldResolution — availableFieldOptions', () => {
    it('incremental append produces identical field options to full recomputation', async () => {
      await fc.assert(
        fc.asyncProperty(arbInitialData, arbAppendData, async (initial, appended) => {
          const allRows = [...initial, ...appended]

          // Incremental path: start with initial, then append
          const incrementalData = ref([...initial])
          const { availableFieldOptions: incrementalResult } =
            setupFieldResolution(incrementalData)
          await nextTick()

          // Simulate loadMore append
          incrementalData.value = [...incrementalData.value, ...appended]
          await nextTick()

          // Full recomputation path: create fresh with all rows
          const fullData = ref(allRows)
          const { availableFieldOptions: fullResult } = setupFieldResolution(fullData)
          await nextTick()

          expect(incrementalResult.value).toEqual(fullResult.value)
        }),
        { numRuns: 100 }
      )
    })
  })

  describe('useDocumentSearch — searchIndex', () => {
    it('incremental append produces identical search results to full recomputation', async () => {
      await fc.assert(
        fc.asyncProperty(arbInitialData, arbAppendData, async (initial, appended) => {
          const allRows = [...initial, ...appended]

          // Incremental path: start with initial, then append
          const incrementalData = ref([...initial])
          const { filteredData: incrementalFiltered } = useDocumentSearch(incrementalData)
          await nextTick()

          // Simulate loadMore append
          incrementalData.value = [...incrementalData.value, ...appended]
          await nextTick()

          // Full recomputation path: create fresh with all rows
          const fullData = ref(allRows)
          const { filteredData: fullFiltered } = useDocumentSearch(fullData)
          await nextTick()

          // With empty query, both should return all rows
          expect(incrementalFiltered.value.length).toBe(fullFiltered.value.length)
          expect(incrementalFiltered.value).toEqual(fullFiltered.value)
        }),
        { numRuns: 100 }
      )
    })

    it('incremental index matches full index for keyword search after append', async () => {
      vi.useFakeTimers()
      try {
        await fc.assert(
          fc.asyncProperty(arbInitialData, arbAppendData, async (initial, appended) => {
            const allRows = [...initial, ...appended]

            // Pick a search term from the appended data if possible
            const searchTerm =
              appended[0]?.summary?.[0]?.value?.slice(0, 3)?.toLowerCase() || 'a'

            // Incremental path
            const incrementalData = ref([...initial])
            const {
              query: incQuery,
              filteredData: incFiltered
            } = useDocumentSearch(incrementalData)
            await nextTick()

            incrementalData.value = [...incrementalData.value, ...appended]
            await nextTick()

            incQuery.value = searchTerm
            await nextTick()
            vi.advanceTimersByTime(400)
            await nextTick()
            await nextTick()

            // Full recomputation path
            const fullData = ref(allRows)
            const {
              query: fullQuery,
              filteredData: fullFiltered
            } = useDocumentSearch(fullData)
            await nextTick()

            fullQuery.value = searchTerm
            await nextTick()
            vi.advanceTimersByTime(400)
            await nextTick()
            await nextTick()

            expect(incFiltered.value.length).toBe(fullFiltered.value.length)
          }),
          { numRuns: 100 }
        )
      } finally {
        vi.useRealTimers()
      }
    })
  })

  describe('useFieldStats — fieldStats', () => {
    it('incremental append produces identical field stats to full recomputation', async () => {
      await fc.assert(
        fc.asyncProperty(arbInitialData, arbAppendData, async (initial, appended) => {
          const allRows = [...initial, ...appended]

          // Incremental path: start with initial, then append
          const incrementalData = ref([...initial])
          const { fieldStats: incrementalStats } = setupFieldStats(incrementalData)
          await nextTick()

          // Simulate loadMore append
          incrementalData.value = [...incrementalData.value, ...appended]
          await nextTick()

          // Full recomputation path: create fresh with all rows
          const fullData = ref(allRows)
          const { fieldStats: fullStats } = setupFieldStats(fullData)
          await nextTick()

          // Compare all field stats
          const incKeys = Object.keys(incrementalStats.value).sort()
          const fullKeys = Object.keys(fullStats.value).sort()
          expect(incKeys).toEqual(fullKeys)

          for (const field of incKeys) {
            const inc = incrementalStats.value[field]
            const full = fullStats.value[field]
            expect(inc.total).toBe(full.total)
            expect(inc.uniqueCount).toBe(full.uniqueCount)
            expect(inc.topValues).toEqual(full.topValues)
          }
        }),
        { numRuns: 100 }
      )
    })
  })
})
