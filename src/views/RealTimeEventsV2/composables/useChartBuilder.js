import { computed } from 'vue'
import { useBreakpoint } from './useBreakpoint'
import { formatDetailed } from '../utils/chart-bucketing'
import { getChartConfig } from '../Blocks/constants/chart-configs'
import { CHART_KINDS, resolveChartKind, isStackedKind, isMultiSeriesKind } from './chart-kinds'
import { buildMultiSeries, buildDirectSeries, buildSingleSeries } from './chart-builder/pivot'
import { createSeriesOrderCache } from './chart-builder/series-order'

// ────────────────────────────────────────────────────────────────────────────
// useChartBuilder — thin composition over the focused chart-builder concerns.
//
// The heavy lifting now lives in ./chart-builder/*:
//   - buckets.js       → viewport-aware bar-count cap (BUCKETS_PER_BREAKPOINT)
//   - formatting.js    → value + axis/tooltip label formatting
//   - series-order.js  → stable stack ordering cache (per-instance; task 7.8)
//   - pivot.js         → raw rows → aligned, zero-backfilled series
//   - scaling.js       → X-axis tick decimation + label-width measurement
//   - config.js        → assemble the final C3 config
//
// The PUBLIC API of this module is unchanged (task 7.5): `useChartBuilder`,
// `buildC3Config`, `resetSeriesOrderCache`, `BUCKETS_PER_BREAKPOINT`, and
// `bucketsForBreakpoint` are all still exported from here so no consumer or
// test needs rewiring.
// ────────────────────────────────────────────────────────────────────────────

// Re-exports preserving the historical public surface of this module.
export { BUCKETS_PER_BREAKPOINT, bucketsForBreakpoint } from './chart-builder/buckets'
export { resetSeriesOrderCache } from './chart-builder/series-order'
export { buildC3Config } from './chart-builder/config'

/**
 * Composable that transforms raw data into C3.js chart configuration.
 *
 * Dispatch is driven by an explicit `chartKind` (see ./chart-kinds.js):
 *   - singleSeriesHistogram: Events volume, single 'count' column.
 *   - stackedHistogram:      Events stacked bars (status/requestMethod).
 *   - multiSeriesTimeseries: Metrics splines (WAF, Bot, ...), never stacked.
 *
 * The kind is resolved from the config key + stack selection by the caller,
 * so each family owns its data-shape assumptions without leaking into the
 * others (no more Object.keys heuristics).
 */
export function useChartBuilder(props) {
  const chartConfig = computed(() => getChartConfig(props.configKey))

  const chartKind = computed(() =>
    resolveChartKind({ configKey: props.configKey, stackBy: props.stackBy })
  )

  // Per-consumer cache of measured label widths keyed by `${formatKey}|${fontSizePx}`.
  // Composable-scoped (not module-scoped) so each EventChart instance has its own
  // map that can be reset on unmount via `resetTickCache()`. This prevents stale
  // entries from leaking across hot-reloads or sibling charts with different
  // computed styles.
  const labelWidthCache = new Map()
  const resetTickCache = () => labelWidthCache.clear()

  // Per-instance series-order cache (task 7.8). Each EventChart / tab owns its
  // own stable stack ordering, so a sibling tab deactivating or unmounting no
  // longer reshuffles this chart's stack (the module-singleton cross-tab bleed).
  // Owned for the composable's lifetime; no manual reset needed.
  const { cachedOrder: cachedSeriesOrder } = createSeriesOrderCache()

  // Viewport-aware label formatting: mobile drops the time half of MM/dd HH:mm
  // to keep ticks readable on narrow screens. Composing `useBreakpoint` inside
  // the data layer keeps `chartData` reactive to breakpoint changes — without
  // this the chart would only reformat after a remount.
  const { current: currentBreakpoint } = useBreakpoint()

  const chartData = computed(() => {
    if (!props.data?.length || !chartConfig.value) {
      return { columns: [], groups: [], seriesNames: [], maxValue: 0, tooltipLabels: [] }
    }

    const rangeStart = props.tsRangeBegin ? new Date(props.tsRangeBegin).getTime() : 0
    const rangeEnd = props.tsRangeEnd ? new Date(props.tsRangeEnd).getTime() : 0
    if (!rangeStart || !rangeEnd) {
      return { columns: [], groups: [], seriesNames: [], maxValue: 0, tooltipLabels: [] }
    }

    const duration = rangeEnd - rangeStart
    const tz = props.userTimezone
    const config = chartConfig.value
    const kind = chartKind.value
    const bp = currentBreakpoint.value

    if (kind === CHART_KINDS.SINGLE_SERIES_HISTOGRAM) {
      return buildSingleSeries(props.data, rangeStart, rangeEnd, duration, tz, bp)
    }

    // stackedHistogram & multiSeriesTimeseries both produce multi-column data;
    // we reuse buildMultiSeries but pass kind-specific ordering + stackKey so
    // the downstream C3 builder can decide to stack or not.
    //
    // Derive the candidate series set from the UNION of keys across all rows,
    // not just the first one. Pivot sources (useMetricsChart.pivotGroupedData)
    // already backfill keys with zeros, but other upstreams (events histogram
    // stacking) may not; sampling the first row alone would under-report
    // series whenever the earliest bucket happens to be sparse.
    const seriesKeySet = new Set()
    for (const row of props.data) {
      if (!row) continue
      for (const keyName of Object.keys(row)) {
        if (keyName === 'ts' || keyName === 'count') continue
        seriesKeySet.add(keyName)
      }
    }
    const sampleKeys = Array.from(seriesKeySet)

    let orderedKeys = sampleKeys
    if (config?.seriesOrder) {
      const filtered = config.seriesOrder.filter((keyName) => seriesKeySet.has(keyName))
      // Fallback: if a hardcoded `seriesOrder` filters to empty, the config
      // has drifted from backend values (e.g. casing mismatch). Keep the
      // chart usable by falling through to the dynamic keys instead of
      // rendering an empty chart.
      orderedKeys = filtered.length ? filtered : sampleKeys
    }

    const stackKey =
      kind === CHART_KINDS.STACKED_HISTOGRAM ? String(props.stackBy || 'default') : 'default'

    // Prefer Events API (buildMultiSeries) for better granularity.
    // Only use Metrics API (buildDirectSeries) if range > 1 day.
    // Metrics returns pre-aggregated data at the correct granularity,
    // avoiding re-bucketing artifacts, but Events gives more detail when available.
    const ONE_DAY_MS = 24 * 60 * 60 * 1000
    const shouldUseMetricsPath =
      kind === CHART_KINDS.MULTI_SERIES_TIMESERIES && duration > ONE_DAY_MS

    if (shouldUseMetricsPath) {
      return buildDirectSeries(props.data, orderedKeys, duration, tz, bp)
    }

    // For percentage/milliseconds data, average instead of sum when multiple
    // rows collapse into the same bucket (summing percentages is nonsensical).
    const dataUnit = config?.dataUnit
    const shouldAverage = dataUnit === 'percentage' || dataUnit === 'milliseconds'

    return buildMultiSeries(
      props.data,
      orderedKeys,
      rangeStart,
      rangeEnd,
      duration,
      tz,
      stackKey,
      false,
      0,
      shouldAverage,
      bp,
      cachedSeriesOrder
    )
  })

  const totalEvents = computed(() => {
    if (!props.data?.length) return 0
    return props.data.reduce((sum, item) => {
      if (item.count !== undefined) return sum + item.count
      let rowSum = 0
      for (const [key, val] of Object.entries(item)) {
        if (key !== 'ts' && typeof val === 'number') rowSum += val
      }
      return sum + rowSum
    }, 0)
  })

  const formattedTotal = computed(() => formatDetailed(totalEvents.value))

  // Backwards-compat flag: callers still read `isMultiSeries` to decide legend
  // visibility etc. Derived from the explicit kind rather than row inspection.
  const isMultiSeries = computed(
    () => isStackedKind(chartKind.value) || isMultiSeriesKind(chartKind.value)
  )

  return {
    chartConfig,
    chartData,
    totalEvents,
    formattedTotal,
    isMultiSeries,
    chartKind,
    labelWidthCache,
    resetTickCache
  }
}
