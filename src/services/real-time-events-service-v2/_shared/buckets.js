// ────────────────────────────────────────────────────────────────────────────
// buckets.js — the SINGLE bucket-sizing rule (task 11.6, req 5.7).
//
// Historically two independent tables mapped a range duration to a bucket
// interval:
//   • `pickBucketMs`      in services/.../load-events-aggregation.js (events path)
//   • `getBucketInterval` in views/.../utils/chart-bucketing.js (chart path)
// They agreed for every duration ≤ 1 day but DIVERGED past that:
//
//   duration ≤   | old pickBucketMs | old getBucketInterval | unified (finer)
//   -------------|------------------|-----------------------|----------------
//   2 d          | 3h (fell to 7d)  | 1h                    | 1h
//   14 d         | 12h              | 12h                   | 12h
//   90 d         | 1d               | 1d                    | 1d
//   365 d        | 1d               | 7d                    | 1d
//   > 365 d      | 1d               | 30d                   | 1d
//
// INTENTIONAL CHANGE: both paths now consume THIS one table, adopting the
// higher-granularity value wherever they diverged. The stacked / pivot chart
// therefore gets finer buckets at 2d (1h) and past a year (1d) than before —
// expected, not a regression. See design.md §5.7.
// ────────────────────────────────────────────────────────────────────────────

const SEC = 1000
const MIN = 60 * SEC
const HOUR = 60 * MIN
const DAY = 24 * HOUR

/**
 * Range → bucket-interval lookup, ascending. Each entry `[maxRange, interval]`;
 * the first row whose `maxRange >= durationMs` wins. Values are the union of the
 * two legacy tables, taking the finer interval at every divergent boundary.
 */
export const BUCKET_TABLE = [
  [1 * MIN, 1 * SEC], // 1 min  → 1s   (60 buckets)
  [5 * MIN, 5 * SEC], // 5 min  → 5s   (60 buckets)
  [15 * MIN, 10 * SEC], // 15 min → 10s  (90 buckets)
  [30 * MIN, 30 * SEC], // 30 min → 30s  (60 buckets)
  [1 * HOUR, 1 * MIN], // 1 h    → 1m   (60 buckets)
  [3 * HOUR, 5 * MIN], // 3 h    → 5m   (36 buckets)
  [6 * HOUR, 10 * MIN], // 6 h    → 10m  (36 buckets)
  [12 * HOUR, 30 * MIN], // 12 h   → 30m  (24 buckets)
  [1 * DAY, 30 * MIN], // 24 h   → 30m  (48 buckets)
  [2 * DAY, 1 * HOUR], // 2 d    → 1h   (48 buckets)  [was 3h in events path]
  [7 * DAY, 3 * HOUR], // 7 d    → 3h   (56 buckets)
  [14 * DAY, 12 * HOUR], // 14 d   → 12h  (28 buckets)
  [30 * DAY, 12 * HOUR], // 30 d   → 12h  (60 buckets)
  [90 * DAY, 1 * DAY], // 90 d   → 1d   (90 buckets)
  [365 * DAY, 1 * DAY], // 365 d  → 1d   [was 7d in chart path]
  [Infinity, 1 * DAY] // > 365d → 1d   [was 30d in chart path]
]

/**
 * Pick the smallest bucket interval that (a) covers `durationMs` and (b) yields
 * no more than `targetMaxBuckets` slots. The cap is a soft target: narrow
 * viewports (~490px) otherwise get 60+ bars at ~7px each — visually
 * incompressible. When no interval satisfies both, the coarsest interval that
 * still covers the duration is returned (fewer-but-wider bars over coverage
 * drift). Callers that don't care about density (the events count/agg path)
 * pass no cap → the table lookup is exact.
 *
 * @param {number} durationMs - Range duration in ms.
 * @param {number} [targetMaxBuckets=Infinity] - Soft cap on output bucket count.
 * @returns {number} Bucket interval in ms.
 */
export function getBucketInterval(durationMs, targetMaxBuckets = Infinity) {
  const minInterval =
    Number.isFinite(targetMaxBuckets) && targetMaxBuckets > 0 ? durationMs / targetMaxBuckets : 0

  for (const [maxRange, interval] of BUCKET_TABLE) {
    if (durationMs <= maxRange && interval >= minInterval) return interval
  }
  for (const [maxRange, interval] of BUCKET_TABLE) {
    if (durationMs <= maxRange) return interval
  }
  return 1 * DAY
}

export { SEC, MIN, HOUR, DAY }
