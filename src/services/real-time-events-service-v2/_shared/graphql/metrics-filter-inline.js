/**
 * metrics-filter-inline.js
 *
 * The single Metrics-API inline filter/variables builder (task 11.1, req 5.1).
 *
 * The Metrics-API query builders in `load-events-aggregation.js` (status chart,
 * request-method chart, cache-status chart, default count path, and the
 * KPI-from-metrics path) each reimplemented the SAME translation of an
 * already-built `{ and, in }` filter into the three pieces every Metrics query
 * needs:
 *   - `fragments`     → `key: $var` strings spliced into `filter: { ... }`
 *   - `declarations`  → `$var: Type` strings spliced into `query ( ... )`
 *   - `variables`     → the GraphQL variables object
 *
 * This module is the byte-equivalent consolidation of those five sites.
 *
 * Deliberate invariants preserved from the legacy inline code:
 *   - **`or` is DROPPED.** Unlike `_shared/build-filter-parts.buildFilterParts`
 *     (which renders a nested `or: [ ... ]` for the list/count queries), the
 *     Metrics-routed builders only ever read `and` and `in`. An `or` group is
 *     never rendered — matching the pre-refactor behaviour exactly (and it is
 *     already stripped upstream by `cleanBuiltFilterForMetrics`, but this helper
 *     must not reintroduce it on its own).
 *   - **Variable naming.** `and` keys → `filter_<key>`; `in` keys → `in_<key>`.
 *     (`buildFilterParts` uses positional `prefix<counter>` names — that is a
 *     DIFFERENT contract for a different endpoint and is NOT unified here.)
 *   - **Scalar typing.** `and` scalars are typed `Int` for numbers, `String`
 *     otherwise. `in` arrays are normalized to strings and typed via
 *     `inferArrayType` (`[Int]`/`[Float]`/`[String]`).
 *   - **`in` value normalization.** Each entry is unwrapped from `{ value }` and
 *     coerced to a string, mirroring the legacy `normalizeInFilterValues`.
 *   - **Optional `status*` skip.** The status/default/kpis sites skip any key
 *     starting with `status` (those become a `statusRange` clause the callers
 *     build themselves); the request-method and cache-status sites do NOT skip.
 *     The `skipStatus` flag selects the variant per-call.
 */

/** GraphQL list type for a (string-normalized) `in` array value. */
function inferArrayType(arr) {
  if (!Array.isArray(arr) || !arr.length) return '[String]'
  const sample = arr[0]
  if (typeof sample === 'number') return Number.isInteger(sample) ? '[Int]' : '[Float]'
  return '[String]'
}

/** Unwrap `{ value }` wrappers and coerce every `in` entry to a string. */
function normalizeInFilterValues(values) {
  if (!Array.isArray(values)) return values
  return values.map((item) => {
    const raw = item?.value !== undefined ? item.value : item
    return String(raw)
  })
}

/**
 * Build the inline filter fragments, param declarations and variables for a
 * Metrics-API query from an already-built `{ and, in }` filter.
 *
 * @param {{ and?: object, in?: object }} [filters]
 * @param {{ skipStatus?: boolean }} [options]
 *   `skipStatus` (default `false`) omits any `and`/`in` key starting with
 *   `status` — those are translated into a `statusRange` clause by the caller.
 * @returns {{ fragments: string[], declarations: string[], variables: object }}
 */
export function buildMetricsInlineFilter(filters = {}, { skipStatus = false } = {}) {
  const fragments = []
  const declarations = []
  const variables = {}

  Object.entries(filters?.and || {}).forEach(([key, value]) => {
    if (skipStatus && key.startsWith('status')) return
    const varName = `filter_${key}`
    variables[varName] = value
    fragments.push(`${key}: $${varName}`)
    declarations.push(`$${varName}: ${typeof value === 'number' ? 'Int' : 'String'}`)
  })

  Object.entries(filters?.in || {}).forEach(([key, value]) => {
    if (skipStatus && key.startsWith('status')) return
    const varName = `in_${key}`
    const normalized = normalizeInFilterValues(value)
    variables[varName] = normalized
    const gqlKey = key.endsWith('In') ? key : `${key}In`
    fragments.push(`${gqlKey}: $${varName}`)
    declarations.push(`$${varName}: ${inferArrayType(normalized)}`)
  })

  return { fragments, declarations, variables }
}

/**
 * Render the `, <fragments>` / `, <declarations>` suffixes (empty string when
 * there are none) the callers splice into the query template. Extracted so the
 * `length ? ', ' + join : ''` idiom lives in one place too.
 *
 * @param {string[]} parts
 * @returns {string}
 */
export function toInlineSuffix(parts) {
  return parts.length ? `, ${parts.join(', ')}` : ''
}
