import { describe, it, expect } from 'vitest'
import { getBucketInterval, BUCKET_TABLE } from '../buckets'

const SEC = 1000
const MIN = 60 * SEC
const HOUR = 60 * MIN
const DAY = 24 * HOUR

// ─────────────────────────────────────────────────────────────────────────────
// Task 11.6 (req 5.7) — SINGLE shared bucket rule.
//
// The two legacy tables (events `pickBucketMs` + chart `getBucketInterval`)
// agreed for every duration ≤ 1 day. This suite:
//   1. pins the shared (unchanged) values for ≤ 1d — byte-equivalent to BOTH,
//   2. CHARACTERIZES the INTENTIONAL higher-granularity change past 1d, where
//      the two tables used to diverge. These are the values the unified rule
//      adopts (the finer of the two). NOT byte-equivalent to the old pivot path
//      — the stacked chart is finer here on purpose. See design.md §5.7.
// ─────────────────────────────────────────────────────────────────────────────

describe('getBucketInterval — shared rule (byte-equivalent region ≤ 1 day)', () => {
  const CASES = [
    [1 * MIN, 1 * SEC],
    [5 * MIN, 5 * SEC],
    [15 * MIN, 10 * SEC],
    [30 * MIN, 30 * SEC],
    [1 * HOUR, 1 * MIN],
    [3 * HOUR, 5 * MIN],
    [6 * HOUR, 10 * MIN],
    [12 * HOUR, 30 * MIN],
    [1 * DAY, 30 * MIN]
  ]
  it.each(CASES)('duration %ims → %ims (matches both legacy tables)', (duration, expected) => {
    expect(getBucketInterval(duration)).toBe(expected)
  })
})

describe('getBucketInterval — INTENTIONAL higher granularity past 1 day (task 11.6)', () => {
  // Each row: [duration, newInterval, oldEventsInterval, oldChartInterval]
  // The new value is the FINER of the two legacy tables.
  const CASES = [
    // 2d: events path fell through to the 7d row (3h); chart path had 1h.
    // Unified → 1h. The events/pivot path is now FINER here.
    [2 * DAY, 1 * HOUR, 3 * HOUR, 1 * HOUR],
    // 7d / 14d / 30d / 90d: both tables already agreed — unchanged.
    [7 * DAY, 3 * HOUR, 3 * HOUR, 3 * HOUR],
    [14 * DAY, 12 * HOUR, 12 * HOUR, 12 * HOUR],
    [30 * DAY, 12 * HOUR, 12 * HOUR, 12 * HOUR],
    [90 * DAY, 1 * DAY, 1 * DAY, 1 * DAY],
    // 365d: chart path had 7d; events path had 1d. Unified → 1d.
    // The stacked/chart path is now FINER here.
    [365 * DAY, 1 * DAY, 1 * DAY, 7 * DAY],
    // > 365d: chart path had 30d; events path had 1d. Unified → 1d.
    [400 * DAY, 1 * DAY, 1 * DAY, 30 * DAY]
  ]
  it.each(CASES)('duration %ims → %ims (new; was events=%i chart=%i)', (duration, newInterval) => {
    expect(getBucketInterval(duration)).toBe(newInterval)
  })
})

describe('getBucketInterval — targetMaxBuckets soft cap', () => {
  it('coarsens the interval so slot count stays under the cap on narrow viewports', () => {
    // 6h uncapped → 10m (36 buckets). Cap at 24 forces ≥ 15m interval → 30m.
    const uncapped = getBucketInterval(6 * HOUR)
    const capped = getBucketInterval(6 * HOUR, 24)
    expect(uncapped).toBe(10 * MIN)
    expect(capped).toBeGreaterThan(uncapped)
    expect((6 * HOUR) / capped).toBeLessThanOrEqual(24)
  })

  it('ignores the cap when it is Infinity (events/pivot path passes no cap)', () => {
    expect(getBucketInterval(6 * HOUR, Infinity)).toBe(getBucketInterval(6 * HOUR))
  })

  it('picks the first row that both covers the duration and satisfies the cap', () => {
    // 1min with cap=1 → minInterval = 60000. The 1s..30s rows are below the cap
    // floor; the 1h row (interval 1m = 60000) is the first that covers 1min AND
    // is ≥ minInterval, so it wins.
    expect(getBucketInterval(1 * MIN, 1)).toBe(1 * MIN)
  })

  it('falls back to the coarsest covering interval when no row satisfies the cap', () => {
    // 400d with a sub-day cap floor: minInterval (400d/1 = 400d) exceeds every
    // table interval, so the first loop finds nothing and the fallback returns
    // the first covering interval (1d for > 365d).
    expect(getBucketInterval(400 * DAY, 1)).toBe(1 * DAY)
  })
})

describe('BUCKET_TABLE shape', () => {
  it('is ascending by maxRange and ends at Infinity', () => {
    for (let idx = 1; idx < BUCKET_TABLE.length; idx += 1) {
      expect(BUCKET_TABLE[idx][0]).toBeGreaterThan(BUCKET_TABLE[idx - 1][0])
    }
    expect(BUCKET_TABLE[BUCKET_TABLE.length - 1][0]).toBe(Infinity)
  })
})
