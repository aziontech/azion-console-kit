import { describe, it, expect, vi } from 'vitest'
import { ref, nextTick } from 'vue'
import fc from 'fast-check'

// Testing outside a component — stub the keep-alive lifecycle hooks
// (useFieldStats releases/rehydrates via useKeepAliveResource, task 9.9).
vi.mock('vue', async () => {
  const actual = await vi.importActual('vue')
  return {
    ...actual,
    onMounted: vi.fn(),
    onActivated: vi.fn(),
    onBeforeUnmount: vi.fn(),
    onDeactivated: vi.fn()
  }
})

import { useFieldStats, TOP_K } from '../useFieldStats.js'

/**
 * Feature: real-time-events-v2-refactor — Property P5 (task 9.2).
 *
 * Validates: Requirements 4.3, 7.5, 4.1.
 *
 * Field stats retain at most K=TOP_K distinct values per field in `topValues`,
 * while `total` remains EXACT (`total === Σ topValues.count + other`) and
 * `uniqueCount` remains exact — even under FIFO eviction (subtracting the oldest
 * rows by identity keeps the totals exact; no positional desync).
 */

const FIELD_KEYS = ['status', 'host', 'method', 'uri', 'code']

const arbValue = fc.integer({ min: 0, max: 400 }).map((numericValue) => `v${numericValue}`)

const arbSummary = fc.array(fc.record({ key: fc.constantFrom(...FIELD_KEYS), value: arbValue }), {
  minLength: 0,
  maxLength: FIELD_KEYS.length
})

// Real events carry unique ids; assign them by position so identity is
// well-defined (the id-keyed index dedupes by id on purpose).
const withUniqueIds = (summaries) =>
  summaries.map((summary, index) => ({ id: `row-${index}`, summary }))

const arbRows = fc.array(arbSummary, { minLength: 0, maxLength: 400 }).map(withUniqueIds)
const arbRowList = (opts) => fc.array(arbSummary, opts).map(withUniqueIds)

const setup = (initial = []) => {
  const data = ref(initial)
  const result = useFieldStats({
    data,
    availableFields: ref([]),
    searchQuery: ref(''),
    selectedFields: ref([])
  })
  return { data, ...result }
}

// Full recomputation oracle: exact per-field counts over the given rows.
const oracleTotals = (rows) => {
  const totals = new Map()
  const uniques = new Map()
  for (const row of rows) {
    if (!Array.isArray(row?.summary)) continue
    for (const { key, value } of row.summary) {
      if (key == null) continue
      const strValue = String(value)
      if (['', '-', 'null', 'undefined'].includes(strValue)) continue
      totals.set(key, (totals.get(key) || 0) + 1)
      let set = uniques.get(key)
      if (!set) {
        set = new Set()
        uniques.set(key, set)
      }
      set.add(strValue)
    }
  }
  return { totals, uniques }
}

describe('Feature: real-time-events-v2-refactor, Property P5: field stats top-K + exact total', () => {
  it('retains <= TOP_K per field with total exact = Σ topK + other; uniqueCount exact', async () => {
    await fc.assert(
      fc.asyncProperty(arbRows, async (rows) => {
        const { fieldStats } = setup(rows)
        await nextTick()

        const { totals, uniques } = oracleTotals(rows)
        const stats = fieldStats.value

        for (const field of Object.keys(stats)) {
          const entry = stats[field]
          // ≤ K entries returned
          expect(entry.topValues.length).toBeLessThanOrEqual(TOP_K)
          // total exact vs oracle
          expect(entry.total).toBe(totals.get(field) || 0)
          // uniqueCount exact vs oracle
          expect(entry.uniqueCount).toBe(uniques.has(field) ? uniques.get(field).size : 0)
          // P5 invariant: total === Σ topValues.count + other
          const topSum = entry.topValues.reduce((sum, tvalue) => sum + tvalue.count, 0)
          expect(topSum + entry.other).toBe(entry.total)
          expect(entry.other).toBeGreaterThanOrEqual(0)
        }
      }),
      { numRuns: 100 }
    )
  })

  // Assert the invariants of every field's stats against a full-recompute oracle.
  const assertExact = (stats, survivors) => {
    const { totals, uniques } = oracleTotals(survivors)
    for (const field of Object.keys(stats)) {
      const entry = stats[field]
      expect(entry.total).toBe(totals.get(field) || 0)
      expect(entry.uniqueCount).toBe(uniques.has(field) ? uniques.get(field).size : 0)
      const topSum = entry.topValues.reduce((sum, tvalue) => sum + tvalue.count, 0)
      expect(topSum + entry.other).toBe(entry.total)
      expect(entry.other).toBeGreaterThanOrEqual(0)
    }
  }

  // ── Path A: production eviction path (rebuild-on-shrink) ──────────────────
  // In the app the sidebar receives `data` as a prop; when the dataset evicts
  // FIFO the buffer SHRINKS below the ingested set, and the length-watch does a
  // full rebuild from the survivors. This isolates that path (NO onEvict call),
  // so the guard fails if the shrink-rebuild is broken.
  it('holds the exact total after a FIFO shrink alone (rebuild-on-shrink path)', async () => {
    await fc.assert(
      fc.asyncProperty(
        arbRowList({ minLength: 1, maxLength: 60 }),
        fc.integer({ min: 1, max: 40 }),
        async (rows, evictCount) => {
          const drop = Math.min(evictCount, rows.length)
          const survivors = rows.slice(drop)

          const { data, fieldStats } = setup([...rows])
          await nextTick()

          // FIFO eviction as the app sees it: the buffer just gets shorter.
          data.value = survivors
          await nextTick()

          assertExact(fieldStats.value, survivors)
        }
      ),
      { numRuns: 100 }
    )
  })

  // ── Path B: onEvict subtract-by-identity path ────────────────────────────
  // The dataset exposes `onEvict(droppedRows)` so a consumer can subtract the
  // evicted rows' contributions WITHOUT a full rebuild. Isolate it: notify
  // onEvict of the dropped rows but keep `data` unchanged (length ≥ ingested,
  // so the length-watch does NOT rebuild and mask the subtraction). The guard
  // fails if onEvict does not subtract by identity.
  it('holds the exact total after onEvict subtracts the oldest by identity (no rebuild)', async () => {
    await fc.assert(
      fc.asyncProperty(
        arbRowList({ minLength: 1, maxLength: 60 }),
        fc.integer({ min: 1, max: 40 }),
        async (rows, evictCount) => {
          const drop = Math.min(evictCount, rows.length)
          const survivors = rows.slice(drop)

          const { fieldStats, onEvict } = setup([...rows])
          await nextTick()

          // Subtract the dropped rows by identity; `data` is left as-is so the
          // length-watch cannot rebuild and hide an incorrect subtraction.
          onEvict(rows.slice(0, drop))
          await nextTick()

          assertExact(fieldStats.value, survivors)
        }
      ),
      { numRuns: 100 }
    )
  })
})
