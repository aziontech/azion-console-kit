/**
 * ts-normalize.js
 *
 * The single timestamp-normalization routine for the Real-Time Events v2
 * GraphQL builders (task 11.5, req 5.5).
 *
 * The Metrics-API / events aggregation builders in `load-events-aggregation.js`
 * (status chart, request-method chart, cache-status chart, default count path,
 * the pivot/time-series query and the KPI-from-metrics path) plus the chart
 * composables (`useMetricsChart` load path, `useChartConfig` brush-select) each
 * reimplemented the SAME one-liner to turn a `tsRange` bound into the string a
 * GraphQL `DateTime!` variable expects:
 *
 *     value instanceof Date ? value.toISOString() : String(value)
 *
 * This module is the byte-equivalent consolidation of those sites.
 *
 * Deliberate invariants preserved from the legacy inline code (verified against
 * a pre-refactor oracle):
 *   - **`Date` → ISO 8601.** A `Date` instance is serialized with
 *     `toISOString()` (UTC, millisecond precision).
 *   - **Everything else → `String(value)`.** Strings pass through unchanged;
 *     numbers, `null`, `undefined`, `NaN` become their `String(...)` form
 *     (`'null'`, `'undefined'`, `'NaN'`, `'1700000000000'`, …) exactly as
 *     before. No coercion to `Date`, no defaulting.
 *   - **Invalid `Date` THROWS.** `new Date('nope').toISOString()` raises
 *     `RangeError: Invalid time value` in the legacy code; this module MUST
 *     reproduce that (it is not a "safer" normalizer). Callers relied on the
 *     inputs already being valid.
 */

/**
 * Normalize a single timestamp bound to the string form a GraphQL `DateTime!`
 * variable expects. Byte-equivalent to the legacy inline expression.
 *
 * @param {Date|string|number|null|undefined} value - A `tsRange` bound.
 * @returns {string} ISO 8601 for a `Date`; `String(value)` otherwise.
 * @throws {RangeError} If `value` is an invalid `Date` (matches legacy).
 */
export function normalizeTsValue(value) {
  return value instanceof Date ? value.toISOString() : String(value)
}

/**
 * Normalize both bounds of a `tsRange`-shaped object in one call, returning the
 * `{ tsRangeBegin, tsRangeEnd }` pair the query builders splice into their
 * variables. Each bound is normalized via {@link normalizeTsValue}.
 *
 * Overload: pass `(begin, end)` as two scalars OR a single `tsRange` object.
 * When called with one argument it is treated as the object form; when called
 * with two it is treated as scalar `begin, end`.
 *
 * @param {{tsRangeBegin: *, tsRangeEnd: *}|Date|string|number} beginOrRange
 *   Either the whole `tsRange` object (single-arg form) or the begin bound
 *   (two-arg form).
 * @param {Date|string|number} [end] - The end bound (two-arg form only).
 * @returns {{tsRangeBegin: string, tsRangeEnd: string}} Normalized bounds.
 * @throws {RangeError} If either bound is an invalid `Date` (matches legacy).
 */
export function normalizeTsBounds(beginOrRange, end) {
  const isObjectForm = arguments.length < 2
  const begin = isObjectForm ? beginOrRange?.tsRangeBegin : beginOrRange
  const endValue = isObjectForm ? beginOrRange?.tsRangeEnd : end
  return {
    tsRangeBegin: normalizeTsValue(begin),
    tsRangeEnd: normalizeTsValue(endValue)
  }
}
