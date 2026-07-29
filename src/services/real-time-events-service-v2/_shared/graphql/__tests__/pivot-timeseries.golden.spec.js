import { describe, it, expect } from 'vitest'
import fc from 'fast-check'
import { pivotTimeseries } from '../pivot-timeseries'

/**
 * Task 11.7 (Property P3) — BYTE-EQUIVALENCE golden oracle for the shared
 * per-`ts` pivot/backfill/sort routine (`_shared/graphql/pivot-timeseries.js`,
 * task 11.2 / req 5.2).
 *
 * The `legacyPivot(...)` below is the general shape EVERY migrated site inlined
 * before 11.2 (fold rows into one entry per ts via a `Map`, optionally
 * accumulate, optionally backfill seen/explicit keys with 0, optionally sort by
 * ts). The recon-flagged per-site nuances are the only knobs: `pickValue` is
 * REQUIRED per site (sum??count??avg vs count??avg??sum vs typeof-number vs
 * row.sum??0), `tsKeyOf` for the `String(ts)` merge site, `accumulate` for the
 * bucket-alias site, and `sort` OPTIONAL (some callers trust orderBy insertion
 * order). The PBT drives all knob combinations against the oracle over ≥100
 * iters and asserts deep-equal arrays (entry order, keys, values, stored ts).
 *
 * This is the equality oracle P3 requires for 11.2 — placed alongside the module
 * under the shared tests folder. (A per-named-site oracle also lives at
 * pivot-timeseries.oracle.spec.js; this golden pins the machinery
 * itself across the full knob matrix.)
 */

// ── Verbatim legacy pivot machinery (the oracle) ────────────────────────────
function legacyPivot(
  series,
  { pickValue, tsKeyOf, tsValueOf, accumulate, backfill, backfillKeys, sort }
) {
  const keyOf = tsKeyOf || ((row) => row.ts)
  const valOf = tsValueOf || ((row) => row.ts)
  const perTs = new Map()
  const seenKeys = []
  for (const { key, rows } of series) {
    if (!seenKeys.includes(key)) seenKeys.push(key)
    for (const row of rows) {
      if (!row?.ts) continue
      const mapKey = keyOf(row)
      if (!perTs.has(mapKey)) perTs.set(mapKey, { ts: valOf(row) })
      const entry = perTs.get(mapKey)
      const value = pickValue(row, key)
      entry[key] = accumulate ? (entry[key] || 0) + value : value
    }
  }
  const result = []
  const fillKeys = backfill ? backfillKeys || seenKeys : null
  perTs.forEach((entry) => {
    if (fillKeys) {
      for (const fillKey of fillKeys) {
        if (entry[fillKey] === undefined) entry[fillKey] = 0
      }
    }
    result.push(entry)
  })
  return sort ? result.sort((left, right) => new Date(left.ts) - new Date(right.ts)) : result
}

const TS_POOL = [
  '2024-01-01T00:00:00Z',
  '2024-01-01T00:01:00Z',
  '2024-01-01T00:02:00Z',
  '2024-01-01T00:03:00Z'
]
const arbTs = fc.oneof(fc.constantFrom(...TS_POOL), fc.constant(undefined))
const arbNum = fc.integer({ min: 0, max: 1000 })
const arbValueRecord = fc.record(
  {
    sum: fc.oneof(arbNum, fc.constant(undefined)),
    count: fc.oneof(arbNum, fc.constant(undefined)),
    avg: fc.oneof(arbNum, fc.constant(undefined))
  },
  { requiredKeys: [] }
)
const arbRow = fc.tuple(arbTs, arbValueRecord).map(([ts, vals]) => ({ ts, ...vals }))
const arbSeries = (keys) =>
  fc.tuple(...keys.map((key) => fc.array(arbRow, { maxLength: 6 }).map((rows) => ({ key, rows }))))

// Per-site pickValue strategies (the recon nuance: REQUIRED per site).
const PICKERS = [
  { name: 'sum??count??avg??0', pick: (row) => row.sum ?? row.count ?? row.avg ?? 0 },
  { name: 'count??avg??sum??0', pick: (row) => row.count ?? row.avg ?? row.sum ?? 0 },
  { name: 'typeof-number', pick: (row, key) => (typeof row[key] === 'number' ? row[key] : 0) },
  { name: 'row.sum??0', pick: (row) => row.sum ?? 0 }
]

describe('P3 golden · pivotTimeseries machinery is byte-equivalent to legacy (11.2)', () => {
  for (const { name, pick } of PICKERS) {
    it(`pickValue=${name} across sort/backfill knobs deep-equals oracle (≥100 iters)`, () => {
      fc.assert(
        fc.property(arbSeries(['a', 'b']), fc.boolean(), fc.boolean(), (series, sort, backfill) => {
          const opts = { pickValue: pick, sort, backfill }
          expect(pivotTimeseries(series, opts)).toEqual(legacyPivot(series, opts))
        }),
        { numRuns: 150 }
      )
    })
  }

  it('accumulate + String(ts) key + explicit backfillKeys deep-equals oracle (merge site)', () => {
    fc.assert(
      fc.property(arbSeries(['2xx', '3xx', '4xx']), (series) => {
        const active = series
          .filter((group) => group.rows.some((row) => row.ts))
          .map((group) => group.key)
        const opts = {
          pickValue: (row) => Number(row.count) || 0,
          tsKeyOf: (row) => String(row.ts),
          accumulate: true,
          backfill: true,
          backfillKeys: active,
          sort: true
        }
        expect(pivotTimeseries(series, opts)).toEqual(legacyPivot(series, opts))
      }),
      { numRuns: 150 }
    )
  })

  it('preserves insertion order when sort is omitted (orderBy-trusting sites)', () => {
    fc.assert(
      fc.property(arbSeries(['x', 'y']), (series) => {
        const opts = { pickValue: (row) => row.sum ?? 0 }
        expect(pivotTimeseries(series, opts)).toEqual(legacyPivot(series, opts))
      }),
      { numRuns: 150 }
    )
  })
})
