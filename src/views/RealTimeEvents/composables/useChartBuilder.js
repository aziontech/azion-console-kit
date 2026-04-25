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

function formatBytes(bytes) {
  if (bytes === 0) return '0 B'
  const kilobyte = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const sizeIndex = Math.floor(Math.log(Math.abs(bytes)) / Math.log(kilobyte))
  return `${(bytes / Math.pow(kilobyte, sizeIndex)).toFixed(2)} ${sizes[sizeIndex] || 'B'}`
}

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

    const isStackedChart = false // spline charts always render at absolute Y values

    // Metrics API charts (MULTI_SERIES_TIMESERIES) return data already
    // aggregated at the correct granularity — plot points directly without
    // re-bucketing. Re-bucketing collapses points and can produce empty slots
    // when the server timestamps don't align with client-computed bucket edges.
    if (kind === CHART_KINDS.MULTI_SERIES_TIMESERIES) {
      return buildDirectSeries(props.data, orderedKeys, duration, tz)
    }

    // For percentage/milliseconds data, average instead of sum when multiple
    // rows collapse into the same bucket (summing percentages is nonsensical).
    const dataUnit = config?.dataUnit
    const shouldAverage = dataUnit === 'percentage' || dataUnit === 'milliseconds'

    return buildMultiSeries(props.data, orderedKeys, rangeStart, rangeEnd, duration, tz, stackKey, false, 0, shouldAverage)
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
const SERIES_ORDER_CACHE_MAX = 50

function cachedOrder(stackKey, seriesFields, computeOrdered) {
  const setKey = `${stackKey}|${[...seriesFields].sort().join(',')}`
  const cached = SERIES_ORDER_CACHE.get(setKey)
  if (cached) return cached
  // Evict oldest entries when the cache exceeds the limit
  if (SERIES_ORDER_CACHE.size >= SERIES_ORDER_CACHE_MAX) {
    const firstKey = SERIES_ORDER_CACHE.keys().next().value
    SERIES_ORDER_CACHE.delete(firstKey)
  }
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
  stackKey = 'default',
  stacked = false,
  minInterval = 0,
  averageOnCollapse = false
) {
  // Use the deterministic bucket interval based on the time range.
  // For Metrics API charts, minInterval = 1 min (data granularity is per-minute).
  // For Events API charts, minInterval = 0 (use the standard bucketing).
  const baseBucket = getBucketInterval(duration)
  const interval = minInterval > baseBucket ? minInterval : baseBucket
  const alignedStart = Math.floor(rangeStart / interval) * interval
  // Don't extend past rangeEnd — the last bucket would be incomplete
  // (data only goes up to "now") causing a visual drop to near-zero.
  const alignedEnd = rangeEnd

  // Pre-fill slots. The last slot must START before rangeEnd.
  const rawSlotCount = Math.max(0, Math.floor((alignedEnd - alignedStart) / interval))
  // Ensure at least 1 slot
  const slotCount = Math.max(1, rawSlotCount)
  const slots = new Array(slotCount)
  for (let idx = 0; idx < slotCount; idx += 1) {
    const slot = { tsMs: alignedStart + idx * interval }
    for (let sIdx = 0; sIdx < seriesFields.length; sIdx += 1) slot[seriesFields[sIdx]] = 0
    slots[idx] = slot
  }

  // Aggregate raw rows into the aligned slots. When multiple rows fall into
  // the same slot, sum their values (correct for count-based data).
  // For percentage/rate fields, track hit counts to average later.
  let globalMax = 0
  for (let idx = 0; idx < rawData.length; idx += 1) {
    const item = rawData[idx]
    if (!item?.ts) continue
    const tsMs = new Date(item.ts).getTime()
    if (!Number.isFinite(tsMs)) continue
    const slotIdx = Math.floor((tsMs - alignedStart) / interval)
    if (slotIdx < 0 || slotIdx >= slotCount) continue
    const slot = slots[slotIdx]
    if (averageOnCollapse) {
      if (slot._hits === undefined) slot._hits = 0
      slot._hits += 1
    }
    for (let sIdx = 0; sIdx < seriesFields.length; sIdx += 1) {
      const field = seriesFields[sIdx]
      const value = item[field]
      if (typeof value === 'number') {
        slot[field] += value
      }
    }
  }

  // For percentage/rate fields, average when multiple rows collapsed into one slot.
  if (averageOnCollapse) {
    for (let idx = 0; idx < slotCount; idx += 1) {
      const slot = slots[idx]
      if (slot._hits > 1) {
        for (let sIdx = 0; sIdx < seriesFields.length; sIdx += 1) {
          slot[seriesFields[sIdx]] /= slot._hits
        }
      }
    }
  }
  // When multiple rows collapsed into one slot, their values were summed.
  // For count-based data this is correct (total events in the bucket).
  // For rate/percentage fields, we need to average instead of sum.
  // The caller signals this via the data unit in the chart config, but
  // buildMultiSeries doesn't have access to it — so we always sum.
  // The averaging for percentage fields is handled upstream by the
  // eventsApiPostProcess callback (e.g. cacheHitRate divides after summing).
  for (let idx = 0; idx < slotCount; idx += 1) {
    const slot = slots[idx]
    if (stacked) {
      let sum = 0
      for (let sIdx = 0; sIdx < seriesFields.length; sIdx += 1) {
        sum += slot[seriesFields[sIdx]] || 0
      }
      if (sum > globalMax) globalMax = sum
    } else {
      for (let sIdx = 0; sIdx < seriesFields.length; sIdx += 1) {
        const val = slot[seriesFields[sIdx]] || 0
        if (val > globalMax) globalMax = val
      }
    }
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

/**
 * Plot pre-aggregated Metrics API data directly without re-bucketing.
 * The server already returns one point per minute/hour/day — collapsing
 * into client-side buckets loses resolution and can produce empty charts
 * when server timestamps don't align with client bucket edges.
 */
function buildDirectSeries(rawData, seriesFields, duration, tz) {
  if (!rawData?.length || !seriesFields?.length) {
    return { columns: [], groups: [], seriesNames: [], maxValue: 0, tooltipLabels: [] }
  }

  // Sort by ts ascending
  const sorted = [...rawData].sort((a, b) => new Date(a.ts) - new Date(b.ts))

  // Detect interval from consecutive timestamps for tooltip range
  let interval = 60 * 1000 // default 1 min
  if (sorted.length >= 2) {
    const gaps = []
    for (let i = 1; i < Math.min(sorted.length, 10); i++) {
      const gap = new Date(sorted[i].ts) - new Date(sorted[i - 1].ts)
      if (gap > 0) gaps.push(gap)
    }
    if (gaps.length) {
      gaps.sort((a, b) => a - b)
      interval = gaps[Math.floor(gaps.length / 2)]
    }
  }

  let globalMax = 0
  const xLabels = []
  const tooltipLabels = []

  for (const item of sorted) {
    const date = new Date(item.ts)
    xLabels.push(formatLabel(date, duration, tz, interval))
    tooltipLabels.push(formatTooltipRange(date, new Date(date.getTime() + interval), duration, tz))

    for (const field of seriesFields) {
      const val = typeof item[field] === 'number' ? item[field] : 0
      if (val > globalMax) globalMax = val
    }
  }

  const columns = [['x', ...xLabels]]
  for (const field of seriesFields) {
    columns.push([field, ...sorted.map((item) => (typeof item[field] === 'number' ? item[field] : 0))])
  }

  return {
    columns,
    groups: [seriesFields],
    seriesNames: seriesFields,
    maxValue: globalMax,
    tooltipLabels
  }
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

  // Chart type by kind:
  //   - stackedHistogram      → stacked bars (discover-style histogram).
  //   - multiSeriesTimeseries → config's chartType wins; defaults to spline.
  //   - singleSeriesHistogram → bars.
  // When a multi-series config explicitly requests 'bar', the chart renders
  // as stacked bars (e.g. Bot Traffic, Bot CAPTCHA) — same visual as
  // stackedHistogram but fed by the metrics pipeline.
  const configuredType = config?.chartType
  let chartType
  if (isStacked) {
    chartType = 'bar'
  } else if (chartKind === CHART_KINDS.MULTI_SERIES_TIMESERIES) {
    // Default to area-spline for a richer visual — filled area under the line
    // makes trends much easier to read than a bare spline.
    chartType = configuredType || 'area-spline'
  } else {
    chartType = 'bar'
  }

  // Multi-series bar charts behave like stacked histograms visually:
  // series are stacked, Y axis gets a nice max, and order is preserved.
  const isMultiBar = isMulti && chartType === 'bar'
  // Only stack when explicitly using bar charts. Spline/area-spline charts
  // render each series at its absolute Y value (no stacking) so the user
  // can see the real magnitude of each series independently.
  const shouldStack = isMultiBar
  // Use config's explicit maxYAxis if set (e.g. percentage charts capped at 100),
  // otherwise compute from data for histograms, or let C3 auto-scale for splines.
  const configMaxY = config?.maxYAxis
  const yMax = configMaxY !== undefined ? configMaxY : ((isMulti && !isMultiBar) ? undefined : niceYMax(maxValue))

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
    // Cache status buckets
    HIT: '#22c55e',
    MISS: '#ef4444',
    STALE: '#eab308',
    BYPASS: '#f97316',
    EXPIRED: '#8b5cf6',
    REVALIDATED: '#06b6d4',
    UPDATING: '#64748b',
    '-': '#a1a1aa',
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

  const stackOrder = shouldStack ? null : 'desc'

  const isAreaChart = chartType === 'area-spline' || chartType === 'area'

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
          culling: {
            max:
              typeof window !== 'undefined' && window.innerWidth < 640
                ? Math.min(6, Math.max(3, Math.floor((columns[0].length - 1) / 6)))
                : Math.min(12, Math.max(6, Math.floor((columns[0].length - 1) / 4)))
          }
        },
        height: 28
      },
      [axisYKey]: {
        ...(yMax !== undefined ? { max: yMax } : {}),
        min: 0,
        padding: { top: 16, bottom: 0 },
        tick: { count: 5, format: formatCompact }
      }
    },
    legend: {
      show: isMulti,
      position: 'bottom',
      equally: true
    },
    tooltip: {
      grouped: isMulti,
      format: {
        title: (idx) => chartData.tooltipLabels?.[idx] || String(idx),
        name: (name) => fullNames[name] || name,
        value: (val) => {
          const unit = config?.dataUnit
          if (unit === 'milliseconds') return `${formatDetailed(Math.round(val * 1000) / 1000)} ms`
          if (unit === 'percentage') return `${(Math.round(val * 100) / 100).toFixed(2)}%`
          if (unit === 'bytes') return formatBytes(val)
          if (unit === 'bitsPerSecond') return `${formatBytes(val)}/s`
          return `${formatDetailed(val)} events`
        }
      }
    },
    bar: (isMulti && !isMultiBar) ? {} : { width: { ratio: 0.7 }, zerobased: true },
    // Smooth monotone interpolation for area/spline charts
    spline: { interpolation: { type: config?.splineInterpolation || (isAreaChart ? 'monotone' : 'cardinal') } },
    // Area opacity: semi-transparent fill under the line
    ...(isAreaChart ? { area: { zerobased: true } } : {}),
    padding: {
      left: typeof window !== 'undefined' && window.innerWidth < 640 ? 35 : 50,
      right: typeof window !== 'undefined' && window.innerWidth < 640 ? 8 : 15,
      top: 8,
      bottom: 0
    },
    grid: {
      [axisYKey]: {
        show: true,
        lines: []
      }
    },
    // Show points only on hover for cleaner look
    point: {
      show: false,
      focus: { expand: { enabled: true, r: 4 } }
    },
    transition: { duration: (columns[0]?.length || 0) > 150 ? 0 : 200 },
    line: { connectNull: true }
  }
}
