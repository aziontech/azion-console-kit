import { computed } from 'vue'
import { useBreakpoint } from './useBreakpoint'
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
import { pickEvenlyDistributed } from './utils/pickEvenlyDistributed'

function formatBytes(bytes) {
  if (bytes === 0) return '0 B'
  const kilobyte = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const sizeIndex = Math.floor(Math.log(Math.abs(bytes)) / Math.log(kilobyte))
  return `${(bytes / Math.pow(kilobyte, sizeIndex)).toFixed(2)} ${sizes[sizeIndex] || 'B'}`
}

// Soft cap on bar count per viewport breakpoint. Anything denser than these
// values produces bars under ~10px wide, which the human eye merges into a
// single blob. The cap drives `getBucketInterval` to pick a coarser bucket
// (e.g. 30s instead of 5s) on narrow viewports, restoring readability.
// Exported so consumers can verify the contract and so the bundler keeps the
// symbol around even under aggressive tree-shaking.
export const BUCKETS_PER_BREAKPOINT = {
  'mobile-s': 24,
  mobile: 32,
  tablet: 60,
  desktop: 120,
  xl: 180
}

export function bucketsForBreakpoint(breakpoint) {
  return BUCKETS_PER_BREAKPOINT[breakpoint] || BUCKETS_PER_BREAKPOINT.desktop
}

/**
 * Detect the largest leading and trailing index ranges where EVERY series in
 * `data` is zero (or numerically equivalent). Used to strip the "ramp-up"
 * and "tail-off" artifacts at the edges of real-time charts:
 *
 *   - Leading zeros: the server's most recent aggregation window hasn't
 *     committed for the oldest part of the query range. First point reads
 *     as 0 even though the real value is non-zero.
 *   - Trailing zeros: the newest bucket is still being populated when the
 *     query lands. Last point reads as 0 / under-populated.
 *
 * Capped at 25% of total points per side so we never trim away a chart that
 * legitimately starts/ends at zero (rare low-traffic windows).
 *
 * @param {Array<Array<number>>} seriesArrays - One value array per series.
 *   All arrays must have the same length.
 * @returns {{ start: number, end: number }} Inclusive-start, exclusive-end
 *   slice indices to use for trimming.
 */
function detectEdgeZeroTrim(seriesArrays) {
  if (!seriesArrays?.length) return { start: 0, end: 0 }
  const length = seriesArrays[0].length
  if (length <= 2) return { start: 0, end: length }

  const isAllZeroAt = (idx) => {
    for (let sIdx = 0; sIdx < seriesArrays.length; sIdx += 1) {
      const val = seriesArrays[sIdx][idx]
      if (typeof val === 'number' && val !== 0) return false
    }
    return true
  }

  const maxTrim = Math.floor(length * 0.25)
  let start = 0
  while (start < maxTrim && isAllZeroAt(start)) start += 1
  let end = length
  while (end > length - maxTrim && isAllZeroAt(end - 1)) end -= 1

  // Refuse to trim everything — at least 1 point must remain.
  if (end - start < 1) return { start: 0, end: length }
  return { start, end }
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

  // Per-consumer cache of measured label widths keyed by `${formatKey}|${fontSizePx}`.
  // Composable-scoped (not module-scoped) so each EventChart instance has its own
  // map that can be reset on unmount via `resetTickCache()`. This prevents stale
  // entries from leaking across hot-reloads or sibling charts with different
  // computed styles.
  const labelWidthCache = new Map()
  const resetTickCache = () => labelWidthCache.clear()

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
      bp
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
  averageOnCollapse = false,
  breakpoint = 'desktop'
) {
  // Use the deterministic bucket interval based on the time range — but cap
  // the bucket count by the viewport breakpoint so narrow screens don't end
  // up with 60+ bars of 7px width each (visually incompressible).
  // For Metrics API charts, minInterval = 1 min (data granularity is per-minute).
  // For Events API charts, minInterval = 0 (use the standard bucketing).
  const targetMaxBuckets = bucketsForBreakpoint(breakpoint)
  const baseBucket = getBucketInterval(duration, targetMaxBuckets)
  const interval = minInterval > baseBucket ? minInterval : baseBucket
  const alignedStart = Math.floor(rangeStart / interval) * interval

  // Only include slots that fall ENTIRELY inside [rangeStart, rangeEnd]:
  //   - First slot: shift forward by one interval when `alignedStart` would
  //     start the slot before rangeStart (partial slot under-fills).
  //   - Last slot: cap so `slotStart + interval <= rangeEnd` (no trailing
  //     partial slot extending past "now" / range end).
  // Eliminates the misleading low values at both edges of the chart.
  const firstSlotTs =
    alignedStart < rangeStart ? alignedStart + interval : alignedStart
  const rawSlotCount = Math.max(0, Math.floor((rangeEnd - firstSlotTs) / interval))
  // Ensure at least 1 slot so the chart can still render (rare edge case
  // when range is shorter than one bucket interval).
  const slotCount = Math.max(1, rawSlotCount)
  const slots = new Array(slotCount)
  for (let idx = 0; idx < slotCount; idx += 1) {
    const slot = { tsMs: firstSlotTs + idx * interval }
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
    // Use `firstSlotTs` (not `alignedStart`) so data falling into the
    // dropped partial first bucket gets excluded with `slotIdx < 0`.
    const slotIdx = Math.floor((tsMs - firstSlotTs) / interval)
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
    xLabels[idx] = formatLabel(date, duration, tz, interval, breakpoint)
    tooltipLabels[idx] = formatTooltipRange(date, new Date(date.getTime() + interval), duration, tz)
  }

  // Per-series value arrays for edge-zero detection.
  const valueArrays = orderedSeries.map((field) => slots.map((slot) => slot[field] || 0))
  const { start, end } = detectEdgeZeroTrim(valueArrays)
  const trimmedXLabels = xLabels.slice(start, end)
  const trimmedTooltipLabels = tooltipLabels.slice(start, end)
  const trimmedValueArrays = valueArrays.map((arr) => arr.slice(start, end))

  const columns = new Array(orderedSeries.length + 1)
  columns[0] = ['x', ...trimmedXLabels]
  for (let sIdx = 0; sIdx < orderedSeries.length; sIdx += 1) {
    columns[sIdx + 1] = [orderedSeries[sIdx], ...trimmedValueArrays[sIdx]]
  }

  return {
    columns,
    groups: [orderedSeries],
    seriesNames: orderedSeries,
    maxValue: globalMax,
    tooltipLabels: trimmedTooltipLabels
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
function buildDirectSeries(rawData, seriesFields, duration, tz, breakpoint = 'desktop') {
  if (!rawData?.length || !seriesFields?.length) {
    return { columns: [], groups: [], seriesNames: [], maxValue: 0, tooltipLabels: [] }
  }

  // Sort by ts ascending
  const sorted = [...rawData].sort((aa, bb) => new Date(aa.ts) - new Date(bb.ts))

  // Detect interval from consecutive timestamps for tooltip range
  let interval = 60 * 1000 // default 1 min
  if (sorted.length >= 2) {
    const gaps = []
    for (let idx = 1; idx < Math.min(sorted.length, 10); idx++) {
      const gap = new Date(sorted[idx].ts) - new Date(sorted[idx - 1].ts)
      if (gap > 0) gaps.push(gap)
    }
    if (gaps.length) {
      gaps.sort((aa, bb) => aa - bb)
      interval = gaps[Math.floor(gaps.length / 2)]
    }
  }

  const xLabels = []
  const tooltipLabels = []

  for (const item of sorted) {
    const date = new Date(item.ts)
    xLabels.push(formatLabel(date, duration, tz, interval, breakpoint))
    tooltipLabels.push(formatTooltipRange(date, new Date(date.getTime() + interval), duration, tz))
  }

  // Build per-series value arrays so we can detect leading/trailing zero
  // ranges and trim them before assembling the C3 columns.
  const valueArrays = seriesFields.map((field) =>
    sorted.map((item) => (typeof item[field] === 'number' ? item[field] : 0))
  )

  const { start, end } = detectEdgeZeroTrim(valueArrays)
  const trimmedXLabels = xLabels.slice(start, end)
  const trimmedTooltipLabels = tooltipLabels.slice(start, end)
  const trimmedValueArrays = valueArrays.map((arr) => arr.slice(start, end))

  let globalMax = 0
  for (const arr of trimmedValueArrays) {
    for (const val of arr) {
      if (typeof val === 'number' && val > globalMax) globalMax = val
    }
  }

  const columns = [['x', ...trimmedXLabels]]
  for (let sIdx = 0; sIdx < seriesFields.length; sIdx += 1) {
    columns.push([seriesFields[sIdx], ...trimmedValueArrays[sIdx]])
  }

  return {
    columns,
    groups: [],
    seriesNames: seriesFields,
    maxValue: globalMax,
    tooltipLabels: trimmedTooltipLabels
  }
}

function buildSingleSeries(rawData, rangeStart, rangeEnd, duration, tz, breakpoint = 'desktop') {
  const targetMaxBuckets = bucketsForBreakpoint(breakpoint)
  const { sortedKeys, bucketMap, bucketMs } = aggregateIntoBuckets(
    rawData,
    rangeStart,
    rangeEnd,
    targetMaxBuckets
  )

  let maxValue = 0
  sortedKeys.forEach((timeKey) => {
    const bucketValue = bucketMap.get(timeKey)
    if (bucketValue > maxValue) maxValue = bucketValue
  })

  const xLabels = sortedKeys.map((key) =>
    formatLabel(new Date(key), duration, tz, bucketMs, breakpoint)
  )

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

// Breakpoints where multi-part date labels (`MM/dd HH:mm`) get truncated to
// just the date half to keep the X-axis legible on narrow screens.
const NARROW_LABEL_BREAKPOINTS = new Set(['mobile-s', 'mobile'])

function formatLabel(date, duration, tz, bucketMs = MIN, breakpoint = 'desktop') {
  if (bucketMs < MIN) {
    return formatInTimezone(
      date,
      { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false },
      tz
    )
  }
  const isNarrow = NARROW_LABEL_BREAKPOINTS.has(breakpoint)
  // Window ≥ 1 day: include the date. On mobile-s/mobile we drop the time half
  // (`MM/dd` only); tablet+ keeps the full `MM/dd HH:mm` for precision.
  if (duration > 7 * DAY) {
    if (isNarrow || bucketMs >= DAY) {
      return formatInTimezone(date, { month: '2-digit', day: '2-digit', hour12: false }, tz)
    }
    return formatInTimezone(
      date,
      { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false },
      tz
    )
  }
  if (duration > DAY) {
    if (isNarrow) {
      return formatInTimezone(date, { month: '2-digit', day: '2-digit', hour12: false }, tz)
    }
    return formatInTimezone(
      date,
      { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false },
      tz
    )
  }
  // Window < 1 day: HH:mm everywhere (matches spec "< 1h range → HH:mm" and is
  // the right default for all sub-day windows on every breakpoint).
  return formatInTimezone(date, { hour: '2-digit', minute: '2-digit', hour12: false }, tz)
}

function formatTooltipRange(start, end, duration, tz) {
  const fmt =
    duration > 7 * DAY
      ? { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }
      : { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }
  return `${formatInTimezone(start, fmt, tz)} - ${formatInTimezone(end, fmt, tz)}`
}

// ────────────────────────────────────────────────────────────────────────────
// Tick decimation — viewport-aware X-axis label management
// ────────────────────────────────────────────────────────────────────────────

const AXIS_FONT_SIZE_PX = 11
// Mobile-class breakpoints where labels can rotate to fit. `desktop`/`xl` keep
// labels horizontal regardless of density (looks cleaner on wide screens).
const ROTATABLE_BREAKPOINTS = new Set(['mobile-s', 'mobile', 'tablet'])
// Minimum horizontal gap (px) between adjacent tick labels — used to compute
// `maxTicks = floor(containerWidth / (longestLabelWidth + LABEL_GAP_PX))`.
const LABEL_GAP_PX = 16
// Per-character width estimate (em ratio) for monospace-leaning sans-serif at
// the axis font size. Empirically conservative — slightly overestimates real
// SVG rendering, which is exactly what we want to prevent label collision.
const CHAR_WIDTH_EM = 0.7
// Safety multiplier applied on top of the character-count estimate. Bumped
// from 1.2 to 1.4 after a regression where labels collided in production on
// HH:mm:ss buckets — measurement underestimated SVG render width.
const LABEL_WIDTH_SAFETY = 1.4
// Fallback cache used when callers invoke `buildC3Config` directly without
// supplying a composable-owned `labelWidthCache`. Bounded to keep memory flat
// in the unlikely path where many distinct (format, font-size) pairs accrue.
const FALLBACK_LABEL_WIDTH_CACHE = new Map()
const FALLBACK_LABEL_WIDTH_CACHE_MAX = 50

/**
 * Measure the widest rendered label width (px) for a list of label strings,
 * using a transient off-screen `<span>` to obtain accurate font metrics.
 *
 * The span is appended to `document.body` and removed in a `finally` block —
 * no node accumulates in the DOM even on measurement error.
 *
 * @param {string[]} labels - Non-empty list of formatted x-axis labels.
 * @param {Element|null} axisProbe - Optional rendered `.c3-axis-x text` element
 *   used to read the actual `font-family`. When `null` we fall back to
 *   `inherit`.
 * @param {number} fontSizePx - Font size in pixels (matches the axis CSS).
 * @returns {number} Width of the longest label after layout, or 0 if DOM APIs
 *   are unavailable (SSR / test environment without document).
 */
function measureLongestLabelWidth(labels, axisProbe, fontSizePx) {
  if (typeof document === 'undefined' || !document.body) return 0
  if (!labels || labels.length === 0) return 0

  // Pick the longest label by string length first — a reasonable proxy that
  // avoids creating N spans. We then measure that single string.
  let longest = labels[0]
  for (let idx = 1; idx < labels.length; idx += 1) {
    if (String(labels[idx]).length > String(longest).length) longest = labels[idx]
  }

  let fontFamily = 'inherit'
  if (axisProbe && typeof window !== 'undefined' && window.getComputedStyle) {
    try {
      const computed = window.getComputedStyle(axisProbe)
      if (computed?.fontFamily) fontFamily = computed.fontFamily
    } catch {
      /* getComputedStyle can throw on detached nodes — keep default */
    }
  }

  const node = document.createElement('span')
  // Off-screen, non-interactive, no layout impact.
  node.style.position = 'absolute'
  node.style.visibility = 'hidden'
  node.style.pointerEvents = 'none'
  node.style.whiteSpace = 'nowrap'
  node.style.top = '-9999px'
  node.style.left = '-9999px'
  node.style.fontFamily = fontFamily
  node.style.fontSize = `${fontSizePx}px`
  node.textContent = String(longest)

  try {
    document.body.appendChild(node)
    const rect = node.getBoundingClientRect()
    return rect?.width || 0
  } finally {
    // NON-NEGOTIABLE: the probe must never accumulate in the DOM, even if
    // `getBoundingClientRect` throws (rare, but layout-dependent code paths
    // can blow up in JSDOM).
    node.remove()
  }
}

/**
 * Cached wrapper around `measureLongestLabelWidth`. Cache key combines the
 * format identity (so different label shapes have separate entries) and the
 * font size in px.
 */
function getCachedLongestLabelWidth(labels, axisProbe, fontSizePx, formatKey, cache) {
  const activeCache = cache instanceof Map ? cache : FALLBACK_LABEL_WIDTH_CACHE
  const cacheKey = `${formatKey}|${fontSizePx}`

  if (activeCache.has(cacheKey)) return activeCache.get(cacheKey)

  const width = measureLongestLabelWidth(labels, axisProbe, fontSizePx)

  // Do NOT cache measurements taken without a real `.c3-axis-x text` probe —
  // the first build runs before C3 has rendered any axis, so inheritance can
  // resolve to a narrower body font than the SVG actually uses. Forcing a
  // re-measurement on the next build (once C3 has painted the axis) makes the
  // decimation converge instead of locking in an underestimate.
  if (!axisProbe) return width

  // Only evict from the fallback cache — the consumer-scoped cache is reset
  // on unmount, so it doesn't need a global eviction policy.
  if (activeCache === FALLBACK_LABEL_WIDTH_CACHE) {
    if (activeCache.size >= FALLBACK_LABEL_WIDTH_CACHE_MAX) {
      const firstKey = activeCache.keys().next().value
      activeCache.delete(firstKey)
    }
  }

  activeCache.set(cacheKey, width)
  return width
}

/**
 * Compute a stable cache key that fingerprints the label shape currently in
 * use (HH:mm vs MM/dd vs MM/dd HH:mm). Derived from the first non-empty label
 * — labels in a given chart share the same format because they come from the
 * same `formatLabel` branch.
 */
function deriveFormatKey(labels) {
  for (let idx = 0; idx < labels.length; idx += 1) {
    const raw = labels[idx]
    if (typeof raw !== 'string' || raw.length === 0) continue
    // Replace digits with `#` to collapse "12:34" and "01:59" to the same key.
    return raw.replace(/\d/g, '#')
  }
  return 'empty'
}

/**
 * Compute the X-axis tick configuration (values, fit, rotate, culling) for a
 * given chart, respecting the active breakpoint and container width.
 *
 * Returns a partial `axis.x.tick` patch that the caller merges onto the base
 * config. When width data is unavailable we fall back to `culling.max` only —
 * matching the legacy behavior so no chart regresses.
 *
 * @returns {{
 *   values?: string[],
 *   fit?: boolean,
 *   rotate?: number,
 *   culling?: { max: number }
 * }}
 */
function computeTickPatch({ naturalTicks, containerWidth, breakpoint, axisProbe, cache }) {
  // Guard: empty/missing data → no patch (legacy culling kicks in).
  if (!naturalTicks || naturalTicks.length === 0) return {}

  const isRotatableBreakpoint = ROTATABLE_BREAKPOINTS.has(breakpoint)

  // Width unavailable (pre-render, hidden container, SSR) → use culling only.
  // This is the documented escape-hatch: no gap guarantee but no regression.
  if (!Number.isFinite(containerWidth) || containerWidth <= 0) {
    return {}
  }

  const formatKey = deriveFormatKey(naturalTicks)

  // Width derivation strategy:
  //  1. Compute a character-count estimate first — deterministic, slightly
  //     conservative (≈0.7em per char + 4px padding).
  //  2. Optionally consult the DOM measurement (cached) and use the LARGER of
  //     the two. Measurement can legitimately exceed the estimate (e.g. when
  //     the actual font is wider than sans-serif average), but it should
  //     never make us pick a narrower slot.
  //  3. Apply LABEL_WIDTH_SAFETY (≥1) on top to absorb HTML-span vs
  //     SVG-text render gap that bit us in production with HH:mm:ss buckets.
  const longestChars = naturalTicks.reduce(
    (max, label) => Math.max(max, String(label).length),
    0
  )
  const charEstimate = Math.ceil(longestChars * AXIS_FONT_SIZE_PX * CHAR_WIDTH_EM + 4)
  const measuredWidth = getCachedLongestLabelWidth(
    naturalTicks,
    axisProbe,
    AXIS_FONT_SIZE_PX,
    formatKey,
    cache
  )
  const longestLabelWidth = Math.max(
    charEstimate,
    Number.isFinite(measuredWidth) ? measuredWidth : 0
  )

  const slotWidth = longestLabelWidth * LABEL_WIDTH_SAFETY + LABEL_GAP_PX
  const maxTicks = Math.max(1, Math.floor(containerWidth / slotWidth))

  // Below capacity → no decimation needed; keep all natural ticks. Don't set
  // `tick.values` (and don't flip `fit`) so chart-kind defaults remain intact.
  if (naturalTicks.length <= maxTicks) {
    const rotate = isRotatableBreakpoint && containerWidth / naturalTicks.length < slotWidth
      ? -45
      : 0
    return { rotate }
  }

  // Decimate by INDEX instead of by string. C3 with a category axis accepts
  // both, but strings can collide when `formatLabel` happens to produce the
  // same value for two adjacent buckets (e.g. sub-minute buckets that all map
  // to the same HH:mm string under certain timezone/DST boundaries). Indices
  // are unambiguous — each one points at exactly one column[0] position.
  const naturalIndices = naturalTicks.map((__, idx) => idx)
  const values = pickEvenlyDistributed(naturalIndices, maxTicks, {
    preserveFirst: true,
    preserveLast: true
  })

  // Rotation only when overlap is still likely after decimation. Wide screens
  // (`desktop`/`xl`) always keep labels horizontal.
  const rotate =
    isRotatableBreakpoint && containerWidth / values.length < slotWidth ? -45 : 0

  return { values, fit: false, rotate }
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
  chartKind = CHART_KINDS.SINGLE_SERIES_HISTOGRAM,
  chartContainer = null,
  getPointerPos = null,
  breakpoint = 'desktop',
  labelWidthCache = null
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
  //   - multiSeriesTimeseries → config's chartType wins; defaults to spline
  //     (line-only). Filled areas occlude lower series in comparison charts
  //     and rarely communicate value — keep them opt-in via config.
  //   - singleSeriesHistogram → bars.
  // When a multi-series config explicitly requests 'bar', the chart renders
  // as stacked bars (e.g. Bot Traffic, Bot CAPTCHA) — same visual as
  // stackedHistogram but fed by the metrics pipeline.
  const configuredType = config?.chartType
  let chartType
  if (isStacked) {
    chartType = 'area-spline'
  } else if (chartKind === CHART_KINDS.MULTI_SERIES_TIMESERIES) {
    chartType = configuredType || 'spline'
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
  const yMax =
    configMaxY !== undefined ? configMaxY : isMulti && !isMultiBar ? undefined : niceYMax(maxValue)

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

  // ── Dynamic tick decimation ───────────────────────────────────────────────
  // Decide how many X-axis labels can fit without overlapping by measuring
  // the longest formatted label and dividing the container width by that
  // slot. Falls back to legacy culling.max when width or measurement is
  // unavailable (SSR, pre-render, JSDOM).
  const naturalTicks =
    Array.isArray(columns[0]) && columns[0].length > 1 ? columns[0].slice(1) : []
  let containerWidth = 0
  if (chartContainer && typeof chartContainer.getBoundingClientRect === 'function') {
    try {
      const rect = chartContainer.getBoundingClientRect()
      containerWidth = rect?.width || 0
    } catch {
      containerWidth = 0
    }
  }
  if (!containerWidth && typeof window !== 'undefined') {
    containerWidth = window.innerWidth || 0
  }
  const axisProbe =
    typeof document !== 'undefined' && typeof document.querySelector === 'function'
      ? document.querySelector('.c3-axis-x text')
      : null

  const tickPatch = computeTickPatch({
    naturalTicks,
    containerWidth,
    breakpoint,
    axisProbe,
    cache: labelWidthCache
  })

  // Legacy culling fallback: keep the same heuristic when we couldn't compute
  // an explicit `values` patch — guarantees no regression vs the pre-task
  // behavior on environments where measurement is not possible.
  const fallbackCullingMax =
    typeof window !== 'undefined' && window.innerWidth < 640
      ? Math.min(6, Math.max(3, Math.floor((columns[0].length - 1) / 6)))
      : Math.min(12, Math.max(6, Math.floor((columns[0].length - 1) / 4)))

  const xTick = {
    multiline: false,
    // When we set explicit `values`, C3 stops culling — `fit: false` keeps
    // labels at their indexed positions instead of redistributing.
    ...(tickPatch.values
      ? { values: tickPatch.values, fit: tickPatch.fit === false ? false : true }
      : { culling: { max: fallbackCullingMax } }),
    rotate: typeof tickPatch.rotate === 'number' ? tickPatch.rotate : 0
  }

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
        tick: xTick,
        height: 28
      },
      [axisYKey]: {
        ...(yMax !== undefined ? { max: yMax } : {}),
        min: 0,
        padding: { top: 0, bottom: 0 },
        tick: { count: 5, format: formatCompact }
      }
    },
    legend: {
      show: isMulti,
      position: 'bottom',
      equally: false,
      item: {
        tile: { width: 10, height: 10 }
      }
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
      },
      // Tooltip positioning — never under the cursor, never covering bars.
      // Strategy: place the tooltip DIAGONALLY offset from the cursor, with
      // the cursor always sitting in the gap between tooltip edge and the
      // hovered bar/line. Cursor is never inside the tooltip bounds.
      ...(chartContainer
        ? {
            position: (data, tooltipWidth, tooltipHeight) => {
              const containerRect = chartContainer.getBoundingClientRect()
              const pointer = typeof getPointerPos === 'function' ? getPointerPos() : null
              const padding = 8
              const OFFSET_X = 32
              const OFFSET_Y = 28

              const cursorX =
                pointer && pointer.present
                  ? pointer.x - containerRect.left
                  : containerRect.width / 2
              const cursorY =
                pointer && pointer.present
                  ? pointer.y - containerRect.top
                  : containerRect.height / 2

              // Horizontal: prefer RIGHT of cursor, flip LEFT when no room
              let left = cursorX + OFFSET_X
              if (left + tooltipWidth > containerRect.width - padding) {
                left = cursorX - tooltipWidth - OFFSET_X
              }
              // Final clamp so it never exits the chart bounds
              left = Math.max(padding, Math.min(left, containerRect.width - tooltipWidth - padding))

              // Vertical: prefer ABOVE cursor, flip BELOW when no room
              let top = cursorY - tooltipHeight - OFFSET_Y
              if (top < padding) {
                top = cursorY + OFFSET_Y
              }
              top = Math.max(padding, Math.min(top, containerRect.height - tooltipHeight - padding))

              return { top, left }
            }
          }
        : {})
    },
    bar: isMulti && !isMultiBar ? {} : { width: { ratio: 0.7 }, zerobased: true },
    // Smooth interpolation for spline charts — linear keeps peaks sharp and Y-axis breathing room
    spline: { interpolation: { type: config?.splineInterpolation || 'monotone' } },
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
      // eslint-disable-next-line id-length
      focus: { expand: { enabled: true, r: 4 } }
    },
    transition: { duration: (columns[0]?.length || 0) > 150 ? 0 : 200 },
    line: { connectNull: true }
  }
}
