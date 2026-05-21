/**
 * chart-api-router.js
 *
 * Single source of truth for the rule:
 *   ≤ 30 min  → Events API  (/v4/events/graphql)
 *   > 30 min  → Metrics API (/v4/metrics/graphql)
 *
 * All chart loaders (loadEventsChartAggregation, useMetricsChart) must import
 * from here instead of duplicating the threshold or the routing logic.
 */

/** Threshold in ms. Ranges ≤ this value use Events API; longer ranges use Metrics API. */
export const CHART_API_THRESHOLD_MS = 30 * 60 * 1000 // 30 minutes

/**
 * Decide which API to use for a given time range.
 *
 * @param {string|Date} tsRangeBegin
 * @param {string|Date} tsRangeEnd
 * @returns {'events'|'metrics'}
 */
export function resolveChartApi(tsRangeBegin, tsRangeEnd) {
  const beginMs = new Date(tsRangeBegin).getTime()
  const endMs = new Date(tsRangeEnd).getTime()
  const duration = endMs - beginMs
  return duration > 0 && duration <= CHART_API_THRESHOLD_MS ? 'events' : 'metrics'
}

/**
 * Return the duration in ms for a tsRange object.
 * @param {{ tsRangeBegin: string|Date, tsRangeEnd: string|Date }} tsRange
 * @returns {number}
 */
export function getTsRangeDurationMs(tsRange) {
  return new Date(tsRange.tsRangeEnd).getTime() - new Date(tsRange.tsRangeBegin).getTime()
}
