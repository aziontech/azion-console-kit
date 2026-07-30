// ────────────────────────────────────────────────────────────────────────────
// PIVOT / BACKFILL concern — turn raw rows into aligned, zero-backfilled series.
//
// Extracted verbatim from useChartBuilder.js (task 7.5): edge-zero trimming,
// multi-series slot construction + backfill, the pre-aggregated metrics path,
// and the single-series histogram path. No behavior change.
// ────────────────────────────────────────────────────────────────────────────

import { aggregateIntoBuckets, getBucketInterval } from '../../utils/chart-bucketing'
import { bucketsForBreakpoint } from './buckets'
import { cachedOrder as defaultCachedOrder } from './series-order'
import { formatLabel, formatTooltipRange } from './formatting'
import { pickEvenlyDistributed } from '../utils/pickEvenlyDistributed'

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
export function detectEdgeZeroTrim(seriesArrays) {
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

export function buildMultiSeries(
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
  breakpoint = 'desktop',
  cachedOrder = defaultCachedOrder
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
  const firstSlotTs = alignedStart < rangeStart ? alignedStart + interval : alignedStart
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

/**
 * Plot pre-aggregated Metrics API data directly without re-bucketing.
 * The server already returns one point per minute/hour/day — collapsing
 * into client-side buckets loses resolution and can produce empty charts
 * when server timestamps don't align with client bucket edges.
 */
export function buildDirectSeries(rawData, seriesFields, duration, tz, breakpoint = 'desktop') {
  if (!rawData?.length || !seriesFields?.length) {
    return { columns: [], groups: [], seriesNames: [], maxValue: 0, tooltipLabels: [] }
  }

  // Precompute each row's numeric timestamp once, then sort numerically. This
  // avoids the two `new Date(aa.ts) - new Date(bb.ts)` allocations per comparison
  // the previous comparator incurred (O(n log n) Date objects → 0).
  const sorted = rawData
    .map((item) => ({ item, tsMs: new Date(item.ts).getTime() }))
    .sort((aa, bb) => aa.tsMs - bb.tsMs)

  // Detect interval from consecutive timestamps for tooltip range
  let interval = 60 * 1000 // default 1 min
  if (sorted.length >= 2) {
    const gaps = []
    for (let idx = 1; idx < Math.min(sorted.length, 10); idx++) {
      const gap = sorted[idx].tsMs - sorted[idx - 1].tsMs
      if (gap > 0) gaps.push(gap)
    }
    if (gaps.length) {
      gaps.sort((aa, bb) => aa - bb)
      interval = gaps[Math.floor(gaps.length / 2)]
    }
  }

  const xLabels = []
  const tooltipLabels = []

  for (const entry of sorted) {
    const date = new Date(entry.tsMs)
    xLabels.push(formatLabel(date, duration, tz, interval, breakpoint))
    tooltipLabels.push(formatTooltipRange(date, new Date(date.getTime() + interval), duration, tz))
  }

  // Build per-series value arrays so we can detect leading/trailing zero
  // ranges and trim them before assembling the C3 columns.
  const valueArrays = seriesFields.map((field) =>
    sorted.map((entry) => (typeof entry.item[field] === 'number' ? entry.item[field] : 0))
  )

  const { start, end } = detectEdgeZeroTrim(valueArrays)

  // Viewport bucket cap (fix C4): buildDirectSeries plots pre-aggregated rows
  // 1:1 with no cap, so a multi-day range emits thousands of spline points that
  // C3 chokes on. Decimate the trimmed range to the same density every other
  // chart path uses. Zero-regression when the trimmed length is at or below the
  // cap: `pickRange` falls back to a plain slice, emitting every point.
  const maxBuckets = bucketsForBreakpoint(breakpoint)
  const trimmedLength = Math.max(0, end - start)
  let selectedIndices = null
  if (trimmedLength > maxBuckets) {
    const trimmedIndices = new Array(trimmedLength)
    for (let idx = 0; idx < trimmedLength; idx += 1) trimmedIndices[idx] = start + idx
    selectedIndices = pickEvenlyDistributed(trimmedIndices, maxBuckets, {
      preserveFirst: true,
      preserveLast: true
    })
  }
  const pickRange = (arr) =>
    selectedIndices ? selectedIndices.map((absIdx) => arr[absIdx]) : arr.slice(start, end)

  const trimmedXLabels = pickRange(xLabels)
  const trimmedTooltipLabels = pickRange(tooltipLabels)
  const trimmedValueArrays = valueArrays.map((arr) => pickRange(arr))

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

export function buildSingleSeries(
  rawData,
  rangeStart,
  rangeEnd,
  duration,
  tz,
  breakpoint = 'desktop'
) {
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
