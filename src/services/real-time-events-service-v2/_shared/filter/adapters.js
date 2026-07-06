/**
 * Metrics-target filter adapters for Real-Time Events v2.
 *
 * Two DISTINCT paths (do not conflate — see design §7.3):
 *
 *   1. `cleanBuiltFilterForMetrics(builtFilter, metricsDataset)` — the
 *      *events-routed-via-metrics* path (`load-events-aggregation.js`). Takes an
 *      ALREADY-BUILT `{ and, in, or }` filter and strips the `and`/`in` keys the
 *      Metrics dataset does not accept. Byte-equivalent replacement for the
 *      legacy local `filterForMetrics`: `.or` is left untouched (the legacy
 *      cleaner never copied it, so it is absent from the output exactly as
 *      before), and `status*` keys survive because `status` is a registered
 *      base field for the HTTP-like datasets — the downstream query builders
 *      then translate them into `statusRange` themselves.
 *
 *   2. `buildForTarget(fields, target)` — the *metrics-VIEW* path
 *      (`useMetricsChart`). Takes the raw clause list, builds the filter, and
 *      keeps only fields expressible in that dataset's convention. No lossy
 *      operator remapper: a field is either supported-and-included or
 *      dropped-and-reported. Never emits a key the Metrics API would reject.
 *
 * Reuses `build-filter.js` (shape construction) and `field-capability.js`
 * (dataset filterability). Pure and framework-agnostic.
 */

import { buildFilter } from './build-filter'
import { METRICS_FILTER_FIELDS, extractBaseField, isFieldSupported } from './field-capability'

/**
 * Strip filter keys not accepted by a Metrics dataset from an already-built
 * `{ and, in, or }` filter (the events→metrics route).
 *
 * Contract (byte-equivalent to the legacy `load-events-aggregation.filterForMetrics`):
 *   - Unknown/unregistered dataset → returns the input filter untouched with
 *     `partial: false` (the legacy cleaner short-circuited the same way).
 *   - Only `and` and `in` groups are inspected; a group is copied into the
 *     result only when at least one key survives.
 *   - `.or` is NOT copied (left untouched, matching the legacy behaviour).
 *   - `status*` keys survive for datasets whose set registers `status`; the
 *     query builders downstream translate them into `statusRange`.
 *   - `partial` is `true` iff at least one events-applicable `and`/`in` key was
 *     dropped.
 *
 * @param {{ and?: object, in?: object, or?: Array<object> }} builtFilter
 * @param {string} metricsDataset
 * @returns {{ cleaned: object, partial: boolean }}
 */
export function cleanBuiltFilterForMetrics(builtFilter, metricsDataset) {
  const allowed = METRICS_FILTER_FIELDS[metricsDataset]
  if (!allowed) return { cleaned: builtFilter, partial: false }

  let partial = false
  const cleaned = {}

  if (builtFilter?.and) {
    const kept = {}
    Object.entries(builtFilter.and).forEach(([key, value]) => {
      if (allowed.has(extractBaseField(key))) {
        kept[key] = value
      } else {
        partial = true
      }
    })
    if (Object.keys(kept).length) cleaned.and = kept
  }

  if (builtFilter?.in) {
    const kept = {}
    Object.entries(builtFilter.in).forEach(([key, value]) => {
      if (allowed.has(extractBaseField(key))) {
        kept[key] = value
      } else {
        partial = true
      }
    })
    if (Object.keys(kept).length) cleaned.in = kept
  }

  return { cleaned, partial }
}

/**
 * Keep only the clauses whose field is expressible in the target dataset, then
 * build the filter shape from that supported subset (the metrics-VIEW route).
 *
 * No lossy operator remapper: `isFieldSupported` gates inclusion, so a clause is
 * either kept verbatim (its base field is registered for the dataset) or dropped
 * and reported in `droppedFields`. This guarantees no unsupported key ever
 * reaches the Metrics query.
 *
 * `partial` is `true` iff at least one clause was dropped, i.e. the built filter
 * does not reflect every active field.
 *
 * @param {Array<object>} fields - raw filter clauses (same shape `buildFilter` consumes).
 * @param {{ api: 'events' } | { api: 'metrics', dataset?: string }} target
 * @returns {{ filter: object, droppedFields: string[], partial: boolean }}
 */
export function buildForTarget(fields, target) {
  if (!Array.isArray(fields) || !fields.length) {
    return { filter: {}, droppedFields: [], partial: false }
  }

  const droppedFields = []
  const supported = fields.filter((clause) => {
    if (isFieldSupported(clause?.valueField, target)) return true
    if (clause?.valueField !== undefined && clause?.valueField !== null) {
      droppedFields.push(clause.valueField)
    } else {
      droppedFields.push(String(clause?.valueField))
    }
    return false
  })

  return {
    filter: buildFilter(supported),
    droppedFields,
    partial: droppedFields.length > 0
  }
}
