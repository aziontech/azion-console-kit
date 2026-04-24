/**
 * Chart kinds isolate the three structurally different chart families rendered
 * by the Real-Time Events experience. Keeping them explicit (instead of
 * inferring from row shape) prevents regressions where tweaking one family —
 * say, how WAF splines interpolate — leaks into another family, like the
 * Events stacked histogram.
 *
 * - singleSeriesHistogram — Events volume histogram, single 'count' series.
 * - stackedHistogram      — Events histogram stacked by status/requestMethod.
 * - multiSeriesTimeseries — Metrics dashboards (WAF, Bot, ...) rendered as
 *                           splines or area-splines without stacking.
 */

export const CHART_KINDS = Object.freeze({
  SINGLE_SERIES_HISTOGRAM: 'singleSeriesHistogram',
  STACKED_HISTOGRAM: 'stackedHistogram',
  MULTI_SERIES_TIMESERIES: 'multiSeriesTimeseries'
})

/**
 * Chart config keys that map to Metrics dashboards (multi-series splines).
 * Any config key not in this list defaults to Events histogram family.
 */
const METRICS_CONFIG_KEYS = new Set([
  // WAF
  'wafThreats',
  'wafXss',
  'wafRfi',
  'wafSql',
  'wafOther',
  'wafThreatsByHost',
  // Bot Manager
  'botTraffic',
  'botCaptcha',
  // Performance — Cache Behavior
  'cacheHitMiss',
  'tieredCacheHitMiss',
  'cacheHitRate',
  // Performance — Latency
  'avgRequestTime',
  'avgUpstreamResponseTime',
  'avgConnectTime',
  // Performance — Throughput
  'bandwidthSavedMissed',
  'requestsSavedMissed'
])

/**
 * Resolve the chart kind from the active chart config key and current stack
 * selection. Explicit dispatch — no heuristic inspection of row shape.
 *
 * @param {Object} params
 * @param {string|null} params.configKey - chart config key (from chart-configs.js)
 * @param {string} params.stackBy - current stack selection ('none' | 'status' | 'requestMethod')
 * @returns {'singleSeriesHistogram'|'stackedHistogram'|'multiSeriesTimeseries'}
 */
export function resolveChartKind({ configKey, stackBy }) {
  if (configKey && METRICS_CONFIG_KEYS.has(configKey)) {
    return CHART_KINDS.MULTI_SERIES_TIMESERIES
  }
  if (stackBy && stackBy !== 'none') {
    return CHART_KINDS.STACKED_HISTOGRAM
  }
  return CHART_KINDS.SINGLE_SERIES_HISTOGRAM
}

export const isStackedKind = (kind) => kind === CHART_KINDS.STACKED_HISTOGRAM
export const isMultiSeriesKind = (kind) => kind === CHART_KINDS.MULTI_SERIES_TIMESERIES
export const isHistogramKind = (kind) =>
  kind === CHART_KINDS.SINGLE_SERIES_HISTOGRAM || kind === CHART_KINDS.STACKED_HISTOGRAM
