import { describe, it, expect } from 'vitest'
import fc from 'fast-check'
import { normalizeTsValue, normalizeTsBounds } from '../_shared/ts-normalize'

/**
 * Byte-equivalence oracle for the shared timestamp normalizer
 * (`_shared/ts-normalize.js`, task 11.5 / req 5.5).
 *
 * Every consolidated site (7 in `load-events-aggregation.js`, the `useMetricsChart`
 * load path, and the `useChartConfig` brush-select) previously inlined the exact
 * expression below. This oracle pins that the extracted module reproduces it
 * BYTE-FOR-BYTE for every input class — including the two nuances the recon
 * flagged: `String(value)` for non-Date (numbers/null/undefined/NaN) and a
 * THROW on an invalid `Date` (the legacy `.toISOString()` raises `RangeError`).
 */

/** The verbatim pre-refactor inline expression, used as the oracle. */
const legacy = (value) => (value instanceof Date ? value.toISOString() : String(value))

describe('normalizeTsValue — byte-equivalent to legacy inline expression', () => {
  it('serializes a valid Date via toISOString (UTC, ms precision)', () => {
    const date = new Date('2026-04-22T18:47:53.123Z')
    expect(normalizeTsValue(date)).toBe('2026-04-22T18:47:53.123Z')
    expect(normalizeTsValue(date)).toBe(legacy(date))
  })

  it('passes strings through unchanged', () => {
    for (const value of ['2026-01-01T00:00:00Z', '1700000000000', '', 'now']) {
      expect(normalizeTsValue(value)).toBe(legacy(value))
    }
  })

  it('String()-coerces numbers, null, undefined and NaN exactly as before', () => {
    expect(normalizeTsValue(1700000000000)).toBe('1700000000000')
    expect(normalizeTsValue(null)).toBe('null')
    expect(normalizeTsValue(undefined)).toBe('undefined')
    expect(normalizeTsValue(NaN)).toBe('NaN')
    for (const value of [1700000000000, null, undefined, NaN]) {
      expect(normalizeTsValue(value)).toBe(legacy(value))
    }
  })

  it('THROWS on an invalid Date, matching the legacy toISOString behavior', () => {
    const invalid = new Date('not-a-date')
    expect(() => legacy(invalid)).toThrow(RangeError)
    expect(() => normalizeTsValue(invalid)).toThrow(RangeError)
  })

  it('PBT: identical to the legacy oracle across mixed input classes (≥100 iters)', () => {
    // `noInvalidDate` keeps `fc.date` from producing `new Date(NaN)` — an invalid
    // Date makes BOTH the module and the legacy oracle throw (the dedicated
    // "THROWS on invalid Date" case above pins that nuance); real call sites
    // never pass an invalid Date.
    const arb = fc.oneof(
      fc.date({
        min: new Date('1971-01-01T00:00:00Z'),
        max: new Date('2100-01-01T00:00:00Z'),
        noInvalidDate: true
      }),
      fc.string(),
      fc.integer(),
      fc.constantFrom(null, undefined)
    )
    fc.assert(
      fc.property(arb, (value) => {
        expect(normalizeTsValue(value)).toBe(legacy(value))
      }),
      { numRuns: 200 }
    )
  })
})

describe('normalizeTsBounds — object-form and scalar-form overloads', () => {
  it('object form: normalizes both bounds of a tsRange (Form A/B call sites)', () => {
    const tsRange = {
      tsRangeBegin: new Date('2026-04-22T18:00:00.000Z'),
      tsRangeEnd: '2026-04-22T19:00:00Z'
    }
    expect(normalizeTsBounds(tsRange)).toEqual({
      tsRangeBegin: '2026-04-22T18:00:00.000Z',
      tsRangeEnd: '2026-04-22T19:00:00Z'
    })
  })

  it('object form is byte-equivalent to the legacy two-const / object-literal sites', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.date({ min: new Date('1971-01-01T00:00:00Z'), noInvalidDate: true }),
          fc.string()
        ),
        fc.oneof(
          fc.date({ min: new Date('1971-01-01T00:00:00Z'), noInvalidDate: true }),
          fc.string()
        ),
        (begin, end) => {
          const tsRange = { tsRangeBegin: begin, tsRangeEnd: end }
          expect(normalizeTsBounds(tsRange)).toEqual({
            tsRangeBegin: legacy(begin),
            tsRangeEnd: legacy(end)
          })
        }
      ),
      { numRuns: 200 }
    )
  })

  it('scalar form: (begin, end) matches the useChartConfig brush-select site', () => {
    const begin = new Date('2026-04-22T18:00:00.000Z')
    const end = new Date('2026-04-22T19:00:00.000Z')
    expect(normalizeTsBounds(begin, end)).toEqual({
      tsRangeBegin: legacy(begin),
      tsRangeEnd: legacy(end)
    })
  })

  it('two-arg form is distinguished from one-arg by arity, not value', () => {
    // A single string arg is treated as the object form → reads .tsRangeBegin (undefined)
    expect(normalizeTsBounds('2026-01-01T00:00:00Z')).toEqual({
      tsRangeBegin: 'undefined',
      tsRangeEnd: 'undefined'
    })
    // Passing the same value as two args is the scalar overload
    expect(normalizeTsBounds('2026-01-01T00:00:00Z', '2026-01-02T00:00:00Z')).toEqual({
      tsRangeBegin: '2026-01-01T00:00:00Z',
      tsRangeEnd: '2026-01-02T00:00:00Z'
    })
  })
})
