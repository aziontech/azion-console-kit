import { describe, it, expect } from 'vitest'
import fc from 'fast-check'
import { normalizeTsValue, normalizeTsBounds } from '../ts-normalize'

/**
 * Task 11.7 (Property P3) — BYTE-EQUIVALENCE golden oracle for the shared
 * timestamp normalizer (`_shared/ts-normalize.js`, task 11.5 / req 5.5).
 *
 * The ten `instanceof Date`-then-toISOString sites (seven in
 * `load-events-aggregation.js`, the `useMetricsChart` load path, the
 * `useChartConfig` brush-select, and the count path) inlined the SAME
 * expression: `value instanceof Date ? value.toISOString() : String(value)`.
 * `legacy(...)` is that expression VERBATIM. The PBT (≥100 iters) asserts the
 * extracted `normalizeTsValue` / `normalizeTsBounds` reproduce it byte-for-byte
 * across Date / string / number / null / undefined, pinning the recon nuances:
 * `String(value)` for non-Date, and the invalid-Date THROW.
 *
 * Placed under the shared tests folder per Task 11.7's golden-oracle path. (A
 * companion characterization also lives at ts-normalize.oracle.spec.js.)
 */

const legacy = (value) => (value instanceof Date ? value.toISOString() : String(value))

const arbBound = fc.oneof(
  fc.date({
    min: new Date('1971-01-01T00:00:00Z'),
    max: new Date('2100-01-01T00:00:00Z'),
    noInvalidDate: true
  }),
  fc.string(),
  fc.integer(),
  fc.constantFrom(null, undefined, NaN)
)

describe('P3 golden · normalizeTsValue is byte-equivalent to legacy inline (11.5)', () => {
  it('deep-equals `Date?toISOString:String(value)` for every input class (≥100 iters)', () => {
    fc.assert(
      fc.property(arbBound, (value) => {
        expect(normalizeTsValue(value)).toBe(legacy(value))
      }),
      { numRuns: 200 }
    )
  })

  it('THROWS on an invalid Date exactly as the legacy toISOString did', () => {
    const invalid = new Date('not-a-date')
    expect(() => legacy(invalid)).toThrow(RangeError)
    expect(() => normalizeTsValue(invalid)).toThrow(RangeError)
  })
})

describe('P3 golden · normalizeTsBounds is byte-equivalent to legacy two-bound sites (11.5)', () => {
  it('object form deep-equals the legacy object-literal site (≥100 iters)', () => {
    fc.assert(
      fc.property(arbBound, arbBound, (begin, end) => {
        expect(normalizeTsBounds({ tsRangeBegin: begin, tsRangeEnd: end })).toEqual({
          tsRangeBegin: legacy(begin),
          tsRangeEnd: legacy(end)
        })
      }),
      { numRuns: 200 }
    )
  })

  it('scalar (begin, end) form deep-equals the brush-select site (≥100 iters)', () => {
    fc.assert(
      fc.property(arbBound, arbBound, (begin, end) => {
        expect(normalizeTsBounds(begin, end)).toEqual({
          tsRangeBegin: legacy(begin),
          tsRangeEnd: legacy(end)
        })
      }),
      { numRuns: 200 }
    )
  })
})
