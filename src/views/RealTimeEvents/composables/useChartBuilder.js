import { computed } from 'vue'
import {
  aggregateIntoBuckets,
  getBucketInterval,
  niceYMax,
  formatCompact,
  formatDetailed,
  formatInTimezone,
  DAY,
  MIN
} from './useChartBucketing'
import { getChartConfig } from '../Blocks/constants/chart-configs'
import { CHART_KINDS, resolveChartKind, isStackedKind, isMultiSeriesKind } from './chart-kinds'

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

    if (kind === CHART_KINDS.SINGLE_SERIES_HISTOGRAM) {
      return buildSingleSeries(props.data, rangeStart, rangeEnd, duration, tz)
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

    return buildMultiSeries(props.data, orderedKeys, rangeStart, rangeEnd, duration, tz, stackKey)
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

  return { chartConfig, chartData, totalEvents, formattedTotal, isMultiSeries, chartKind }
}

// Cache of series ordering so that a given (stackKey, seriesSet) keeps a stable
// stack position across re-renders. Prevents c3 from visually reshuffling the
// stack when totals fluctuate between filter/range changes.
const SERIES_ORDER_CACHE = new Map()
function cachedOrder(stackKey, seriesFields, computeOrdered) {
  const setKey = `${stackKey}|${[...seriesFields].sort().join(',')}`
  const cached = SERIES_ORDER_CACHE.get(setKey)
  if (cached) return cached
  const ordered = computeOrdered()
  SERIES_ORDER_CACHE.set(setKey, ordered)
  return ordered
}

function buildMultiSeries(
  rawData,
  seriesFields,
  rangeStart,
  rangeEnd,
  duration,
  tz,
  stackKey = 'default'
) {
  // Use the same Kibana-style bucket interval as single-series to avoid
  // "thin" charts when cardinality is high and the server truncates rows.
  const interval = getBucketInterval(duration)
  const alignedStart = Math.floor(rangeStart / interval) * interval
  const alignedEnd = Math.floor(rangeEnd / interval) * interval

  // Pre-fill all slots from aligned start to aligned end with zeros.
  const slotCount = Math.max(0, Math.floor((alignedEnd - alignedStart) / interval) + 1)
  const slots = new Array(slotCount)
  for (let idx = 0; idx < slotCount; idx += 1) {
    const slot = { tsMs: alignedStart + idx * interval }
    for (let sIdx = 0; sIdx < seriesFields.length; sIdx += 1) slot[seriesFields[sIdx]] = 0
    slots[idx] = slot
  }

  // Aggregate raw rows by summing into the aligned slot. `rawData` may contain
  // multiple rows per slot if the pivot didn't align server-side.
  let globalMax = 0
  for (let idx = 0; idx < rawData.length; idx += 1) {
    const item = rawData[idx]
    if (!item?.ts) continue
    const tsMs = new Date(item.ts).getTime()
    if (!Number.isFinite(tsMs)) continue
    const slotIdx = Math.floor((tsMs - alignedStart) / interval)
    if (slotIdx < 0 || slotIdx >= slotCount) continue
    const slot = slots[slotIdx]
    let rowSum = 0
    for (let sIdx = 0; sIdx < seriesFields.length; sIdx += 1) {
      const field = seriesFields[sIdx]
      const value = item[field]
      if (typeof value === 'number') {
        slot[field] += value
        rowSum += value
      }
    }
    if (rowSum && slot._sum === undefined) slot._sum = 0
    if (rowSum) slot._sum += rowSum
  }
  for (let idx = 0; idx < slotCount; idx += 1) {
    const sum = slots[idx]._sum || 0
    if (sum > globalMax) globalMax = sum
  }

  // Stable series ordering: largest-at-bottom decided once per stackKey+set.
  const orderedSeries = cachedOrder(stackKey, seriesFields, () => {
    const totals = {}
    for (let sIdx = 0; sIdx < seriesFields.length; sIdx += 1) {
      const field = seriesFields[sIdx]
      let sum = 0
      for (let idx = 0; idx < slotCount; idx += 1) sum += slots[idx][field] || 0
      totals[field] = sum
    }
    return [...seriesFields].sort((left, right) => totals[right] - totals[left])
  })

  const xLabels = new Array(slotCount)
  const tooltipLabels = new Array(slotCount)
  for (let idx = 0; idx < slotCount; idx += 1) {
    const date = new Date(slots[idx].tsMs)
    xLabels[idx] = formatLabel(date, duration, tz, interval)
    tooltipLabels[idx] = formatTooltipRange(date, new Date(date.getTime() + interval), duration, tz)
  }

  const columns = new Array(orderedSeries.length + 1)
  columns[0] = ['x', ...xLabels]
  for (let sIdx = 0; sIdx < orderedSeries.length; sIdx += 1) {
    const field = orderedSeries[sIdx]
    const series = new Array(slotCount + 1)
    series[0] = field
    for (let idx = 0; idx < slotCount; idx += 1) series[idx + 1] = slots[idx][field] || 0
    columns[sIdx + 1] = series
  }

  return {
    columns,
    groups: [orderedSeries],
    seriesNames: orderedSeries,
    maxValue: globalMax,
    tooltipLabels
  }
}

// Exposed so tab-panel-block can reset ordering on dataset/stackBy change.
export function resetSeriesOrderCache() {
  SERIES_ORDER_CACHE.clear()
}

function buildSingleSeries(rawData, rangeStart, rangeEnd, duration, tz) {
  const { sortedKeys, bucketMap, bucketMs } = aggregateIntoBuckets(rawData, rangeStart, rangeEnd)

  let maxValue = 0
  sortedKeys.forEach((timeKey) => {
    const bucketValue = bucketMap.get(timeKey)
    if (bucketValue > maxValue) maxValue = bucketValue
  })

  const xLabels = sortedKeys.map((key) => formatLabel(new Date(key), duration, tz, bucketMs))

  const tooltipLabels = sortedKeys.map((key) => {
    return formatTooltipRange(new Date(key), new Date(key + bucketMs), duration, tz)
  })

  return {
    columns: [
      ['x', ...xLabels],
      ['count', ...sortedKeys.map((timeKey) => bucketMap.get(timeKey) || 0)]
    ],
    groups: [['count']],
    seriesNames: ['count'],
    maxValue,
    tooltipLabels
  }
}

function formatLabel(date, duration, tz, bucketMs = MIN) {
  if (bucketMs < MIN) {
    return formatInTimezone(
      date,
      { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false },
      tz
    )
  }
  if (duration > 7 * DAY) {
    return bucketMs < DAY
      ? formatInTimezone(
          date,
          { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false },
          tz
        )
      : formatInTimezone(date, { month: '2-digit', day: '2-digit', hour12: false }, tz)
  }
  if (duration > DAY)
    return formatInTimezone(
      date,
      { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false },
      tz
    )
  return formatInTimezone(date, { hour: '2-digit', minute: '2-digit', hour12: false }, tz)
}

function formatTooltipRange(start, end, duration, tz) {
  const fmt =
    duration > 7 * DAY
      ? { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }
      : { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }
  return `${formatInTimezone(start, fmt, tz)} - ${formatInTimezone(end, fmt, tz)}`
}

/**
 * Build the C3.js config object from chartData and chartConfig.
 *
 * Renders one of three visual shapes based on `chartKind`:
 *   - singleSeriesHistogram → monochromatic bars, no legend.
 *   - stackedHistogram       → stacked bars, legend, clickable buckets.
 *   - multiSeriesTimeseries  → spline/area-spline, legend, no stacking.
 */
export function buildC3Config({
  chartRef,
  chartData,
  chartConfig,
  chartKind = CHART_KINDS.SINGLE_SERIES_HISTOGRAM
}) {
  if (!chartData.columns.length || !chartRef) return null

  const axisXKey = 'x'
  const axisYKey = 'y'

  const config = chartConfig
  const { columns, groups, seriesNames, maxValue } = chartData
  const isStacked = chartKind === CHART_KINDS.STACKED_HISTOGRAM
  const isMulti = isStacked || chartKind === CHART_KINDS.MULTI_SERIES_TIMESERIES
  const yMax = isMulti ? undefined : niceYMax(maxValue)

  const SERIES_COLORS = {
    // Status buckets
    '2xx': '#22c55e',
    '3xx': '#3b82f6',
    '4xx': '#eab308',
    '5xx': '#ef4444',
    // Request method buckets
    GET: '#22c55e',
    POST: '#3b82f6',
    PUT: '#eab308',
    DELETE: '#ef4444',
    // Fallback bucket for unclassified values
    other: '#737373'
  }
  const DEFAULT_COLORS = ['#F3652B', '#22c55e', '#3b82f6', '#eab308', '#ef4444']

  const colors = {}
  seriesNames.forEach((name, index) => {
    colors[name] =
      config.seriesColors?.[name] ||
      SERIES_COLORS[name] ||
      DEFAULT_COLORS[index % DEFAULT_COLORS.length]
  })

  const LEGEND_MAX_CHARS = 24

  // fullNames keeps the original label for tooltip display.
  const fullNames = {}
  const names = {}
  seriesNames.forEach((name) => {
    const label = config.seriesLabels?.[name] || name
    fullNames[name] = label
    names[name] = label.length > LEGEND_MAX_CHARS ? `${label.slice(0, LEGEND_MAX_CHARS)}…` : label
  })

  // Chart type by kind:
  //   - stackedHistogram      → stacked bars (discover-style histogram).
  //   - multiSeriesTimeseries → spline, unless the config opts into a custom
  //                              type (e.g. WAF uses area-spline + monotone).
  //   - singleSeriesHistogram → bars.
  // Chart-config's explicit `chartType` wins over the default *only* for
  // multi-series time-series; stacked and single histograms stay as bars to
  // preserve the histogram affordance regardless of chart-config defaults.
  const configuredType = config?.chartType
  let chartType
  if (isStacked) {
    chartType = 'bar'
  } else if (chartKind === CHART_KINDS.MULTI_SERIES_TIMESERIES) {
    chartType = configuredType && configuredType !== 'bar' ? configuredType : 'spline'
  } else {
    chartType = 'bar'
  }

  // `null` preserves the column order we built in buildMultiSeries (largest
  // first = bottom). Setting 'desc'/'asc' here lets c3 re-sort internally,
  // which caused the visible stack to flip in some builds.
  const shouldStack = isStacked
  const stackOrder = shouldStack ? null : 'desc'

  return {
    bindto: chartRef,
    data: {
      [axisXKey]: axisXKey,
      columns,
      type: chartType,
      colors,
      names,
      groups: shouldStack ? groups : [],
      order: stackOrder,
      ...(shouldStack ? { stack: { normalize: false } } : {})
    },
    axis: {
      [axisXKey]: {
        type: 'category',
        tick: {
          multiline: false,
          culling: { max: Math.min(12, Math.max(6, Math.floor((columns[0].length - 1) / 4))) }
        },
        height: 28
      },
      [axisYKey]: {
        ...(yMax !== undefined ? { max: yMax } : {}),
        min: 0,
        padding: { top: 10, bottom: 0 },
        tick: { count: 5, format: formatCompact }
      }
    },
    legend: {
      show: isMulti,
      position: 'bottom',
      equally: true
      // Legend clicks fall through to c3's native handler: clicking a series
      // hides it, the remaining series gain focus, and the Y axis rescales
      // to the visible data; clicking again brings it back. Overriding
      // `item.onclick` here would disable that default and the chart would
      // stop reacting — we intentionally avoid it.
    },
    tooltip: {
      grouped: isMulti,
      format: {
        title: (idx) => chartData.tooltipLabels?.[idx] || String(idx),
        name: (name) => fullNames[name] || name,
        value: (val) => `${formatDetailed(val)} events`
      }
    },
    bar: isMulti ? {} : { width: { ratio: 0.85 } },
    ...(config?.splineInterpolation
      ? { spline: { interpolation: { type: config.splineInterpolation } } }
      : {}),
    padding: { left: 50, right: 15, top: 5, bottom: 0 },
    grid: { [axisYKey]: { show: true } },
    point: { show: false },
    // Disable entrance/update transitions when rendering large series —
    // animating hundreds of bars/points dominates the frame budget and is
    // visually noisy. 150 slots is the heuristic cutoff.
    transition: { duration: (columns[0]?.length || 0) > 150 ? 0 : 120 },
    line: { connectNull: true }
  }
}
