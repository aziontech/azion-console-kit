import { describe, it, expect } from 'vitest'
import fc from 'fast-check'
import { getBucketInterval, BUCKET_TABLE, SEC, MIN, HOUR, DAY } from '../buckets'

/**
 * Task 11.7 (Property P3, INTENTIONAL branch) — CHARACTERIZATION of the unified
 * bucket rule (`_shared/buckets.js`, task 11.6 / req 5.7).
 *
 * This is NOT a byte-equivalence oracle. Task 11.6 deliberately unified the two
 * legacy tables (`pickBucketMs` in load-events-aggregation.js vs
 * `getBucketInterval` in chart-bucketing.js) into ONE table using the
 * HIGHER-granularity value wherever they diverged. The stacked/pivot chart gets
 * finer buckets at 2d and past a year — EXPECTED, not a regression. This suite
 * PINS the NEW behavior (so a future drift is caught) and records the exact
 * divergence from each legacy table, per Task 11.7's characterization mandate.
 */

// The two legacy tables, VERBATIM, so the characterization documents precisely
// where the unified rule diverges from each (and that it took the finer value).
const LEGACY_EVENTS = [
  [1 * MIN, 1 * SEC],
  [5 * MIN, 5 * SEC],
  [15 * MIN, 10 * SEC],
  [30 * MIN, 30 * SEC],
  [1 * HOUR, 1 * MIN],
  [3 * HOUR, 5 * MIN],
  [6 * HOUR, 10 * MIN],
  [12 * HOUR, 30 * MIN],
  [1 * DAY, 30 * MIN],
  [7 * DAY, 3 * HOUR], // events had NO 2d row → 2d fell through to 7d (3h)
  [14 * DAY, 12 * HOUR],
  [30 * DAY, 12 * HOUR],
  [Infinity, 1 * DAY] // events capped at 1d for everything past 30d
]
const LEGACY_CHART = [
  [1 * MIN, 1 * SEC],
  [5 * MIN, 5 * SEC],
  [15 * MIN, 10 * SEC],
  [30 * MIN, 30 * SEC],
  [1 * HOUR, 1 * MIN],
  [3 * HOUR, 5 * MIN],
  [6 * HOUR, 10 * MIN],
  [12 * HOUR, 30 * MIN],
  [1 * DAY, 30 * MIN],
  [2 * DAY, 1 * HOUR],
  [7 * DAY, 3 * HOUR],
  [14 * DAY, 12 * HOUR],
  [30 * DAY, 12 * HOUR],
  [90 * DAY, 1 * DAY],
  [365 * DAY, 7 * DAY],
  [Infinity, 30 * DAY]
]
const legacyLookup = (table) => (durationMs) => {
  for (const [maxRange, interval] of table) if (durationMs <= maxRange) return interval
  return 1 * DAY
}
const legacyEvents = legacyLookup(LEGACY_EVENTS)
const legacyChart = legacyLookup(LEGACY_CHART)

describe('11.6 characterization · unified rule ≤ 1 day agrees with BOTH legacy tables', () => {
  const AGREED = [
    1 * MIN,
    5 * MIN,
    15 * MIN,
    30 * MIN,
    1 * HOUR,
    3 * HOUR,
    6 * HOUR,
    12 * HOUR,
    1 * DAY
  ]
  it.each(AGREED)(
    'duration %ims is byte-equivalent to both legacy tables (unchanged)',
    (duration) => {
      expect(getBucketInterval(duration)).toBe(legacyEvents(duration))
      expect(getBucketInterval(duration)).toBe(legacyChart(duration))
    }
  )

  it('PBT: ≤ 1 day the unified rule equals both legacy tables (≥100 iters)', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 1 * DAY }), (durationMs) => {
        expect(getBucketInterval(durationMs)).toBe(legacyEvents(durationMs))
        expect(getBucketInterval(durationMs)).toBe(legacyChart(durationMs))
      }),
      { numRuns: 200 }
    )
  })
})

describe('11.6 characterization · INTENTIONAL higher granularity past 1 day', () => {
  // [duration, NEW unified, was-events, was-chart, note]
  const CASES = [
    [
      2 * DAY,
      1 * HOUR,
      3 * HOUR,
      1 * HOUR,
      'events fell through to 7d (3h); unified took chart 1h'
    ],
    [7 * DAY, 3 * HOUR, 3 * HOUR, 3 * HOUR, 'both agreed'],
    [14 * DAY, 12 * HOUR, 12 * HOUR, 12 * HOUR, 'both agreed'],
    [30 * DAY, 12 * HOUR, 12 * HOUR, 12 * HOUR, 'both agreed'],
    [90 * DAY, 1 * DAY, 1 * DAY, 1 * DAY, 'both agreed'],
    [365 * DAY, 1 * DAY, 1 * DAY, 7 * DAY, 'chart had 7d; unified took events 1d (finer)'],
    [400 * DAY, 1 * DAY, 1 * DAY, 30 * DAY, 'chart had 30d; unified took events 1d (finer)']
  ]

  it.each(CASES)(
    'duration %ims → NEW %ims (was events=%i chart=%i) — %s',
    (duration, newInterval, wasEvents, wasChart) => {
      expect(getBucketInterval(duration)).toBe(newInterval)
      // The unified value is the FINER (smaller) of the two legacy tables.
      expect(newInterval).toBe(Math.min(wasEvents, wasChart))
    }
  )

  it('is never COARSER than either legacy table anywhere (unified = finer-of-two)', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 800 * DAY }), (durationMs) => {
        const unified = getBucketInterval(durationMs)
        expect(unified).toBeLessThanOrEqual(legacyEvents(durationMs))
        expect(unified).toBeLessThanOrEqual(legacyChart(durationMs))
      }),
      { numRuns: 200 }
    )
  })
})

describe('11.6 characterization · targetMaxBuckets soft cap (chart path only)', () => {
  it('coarsens so slot count stays within the cap on narrow viewports', () => {
    const uncapped = getBucketInterval(6 * HOUR)
    const capped = getBucketInterval(6 * HOUR, 24)
    expect(capped).toBeGreaterThan(uncapped)
    expect((6 * HOUR) / capped).toBeLessThanOrEqual(24)
  })

  it('Infinity cap (events/pivot path) is identical to the uncapped table lookup', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 800 * DAY }), (durationMs) => {
        expect(getBucketInterval(durationMs, Infinity)).toBe(getBucketInterval(durationMs))
      }),
      { numRuns: 200 }
    )
  })
})

describe('11.6 characterization · BUCKET_TABLE shape', () => {
  it('is strictly ascending by maxRange and ends at Infinity', () => {
    for (let idx = 1; idx < BUCKET_TABLE.length; idx += 1) {
      expect(BUCKET_TABLE[idx][0]).toBeGreaterThan(BUCKET_TABLE[idx - 1][0])
    }
    expect(BUCKET_TABLE.at(-1)[0]).toBe(Infinity)
  })
})
