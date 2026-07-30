/**
 * pivot-timeseries.js
 *
 * The single per-`ts` pivot / backfill / sort-by-ts routine (task 11.2, req 5.2).
 *
 * Across `metrics-chart-service.js` and `load-events-aggregation.js` roughly a
 * dozen call sites reimplemented the SAME shape: fold a set of rows into one
 * entry per timestamp (`{ ts, <category>: value, ... }`), optionally backfill
 * every seen category with `0`, and optionally sort the entries chronologically.
 *
 * Every site differs ONLY in how it extracts the value from a row — the
 * precedence for the aggregate field is site-specific (`sum??count??avg` vs
 * `count??avg??sum` vs `typeof val === 'number' ? val : 0` vs `row.sum ?? 0`),
 * so `pickValue` is a REQUIRED per-site argument. Sorting is OPTIONAL because
 * some callers rely on GraphQL's `orderBy: [ts_ASC]` insertion order and never
 * re-sort. This module makes those two the only knobs and keeps the merge /
 * backfill machinery in one place.
 *
 * BYTE-EQUIVALENCE: for every migrated site the produced array (entry order,
 * keys, values, and the exact `ts` value stored on each entry) is identical to
 * the pre-refactor inline code. Time-bucket alignment (the `pickBucketMs`
 * path in `pivotGroupedRows`) is deliberately NOT handled here — bucketing is
 * unified separately in task 11.6.
 */

/** Default chronological comparator, matching every legacy site verbatim. */
const byTsAsc = (left, right) => new Date(left.ts) - new Date(right.ts)

/**
 * Fold `series` (an ordered list of `{ key, rows }` groups — one group per
 * alias / field / classified bucket) into one entry per timestamp.
 *
 * @template TRow
 * @param {Array<{ key: string, rows: TRow[] }>} series
 *   Ordered groups. `key` is the category column written onto each ts entry;
 *   `rows` are the raw rows for that category. Iterated in order, so the first
 *   time a `ts` is seen fixes that entry's insertion position (matching the
 *   legacy `Map` iteration order exactly).
 * @param {object} options
 * @param {(row: TRow, key: string) => number} options.pickValue
 *   REQUIRED. Extracts the numeric value a row contributes. Receives the group
 *   `key` as a second arg for the sites that read `row[field]`.
 * @param {(row: TRow) => (string|number)} [options.tsKeyOf]
 *   Maps a row to its Map key. Defaults to `row.ts`. A site that keys by
 *   `String(row.ts)` (while still storing the original `row.ts`) passes this.
 * @param {(row: TRow) => *} [options.tsValueOf]
 *   The `ts` value stored on a freshly created entry. Defaults to `row.ts`.
 * @param {boolean} [options.accumulate=false]
 *   When `true`, repeated `(ts, key)` pairs sum (`+=`); when `false`, the last
 *   write wins (`=`). Mirrors the two legacy variants.
 * @param {boolean} [options.backfill=false]
 *   When `true`, every entry is backfilled with `0` for every group `key`
 *   listed in `backfillKeys` (or all group keys when `backfillKeys` is omitted).
 * @param {string[]} [options.backfillKeys]
 *   Explicit set of keys to backfill (e.g. only the buckets whose total > 0).
 * @param {boolean} [options.sort=false]
 *   When `true`, the result is sorted chronologically by `ts`.
 * @returns {Array<object>} one entry per timestamp
 */
export function pivotTimeseries(series, options) {
  const {
    pickValue,
    tsKeyOf = (row) => row.ts,
    tsValueOf = (row) => row.ts,
    accumulate = false,
    backfill = false,
    backfillKeys,
    sort = false
  } = options

  const perTs = new Map()
  const seenKeys = []

  for (const { key, rows } of series) {
    if (!seenKeys.includes(key)) seenKeys.push(key)
    for (const row of rows) {
      if (!row?.ts) continue
      const mapKey = tsKeyOf(row)
      if (!perTs.has(mapKey)) perTs.set(mapKey, { ts: tsValueOf(row) })
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

  return sort ? result.sort(byTsAsc) : result
}
