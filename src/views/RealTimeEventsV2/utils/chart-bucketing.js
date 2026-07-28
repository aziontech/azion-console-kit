/**
 * Chart bucketing logic for event histograms.
 *
 * The range→interval lookup and `getBucketInterval` now live in the SINGLE
 * shared rule (`_shared/buckets.js`, task 11.6) so the chart path and the
 * events/pivot path can never drift again. Re-exported here for the existing
 * chart-builder consumers.
 */

import {
  getBucketInterval,
  MIN,
  HOUR,
  DAY
} from '@/services/real-time-events-service-v2/_shared/buckets'

export { getBucketInterval }

/**
 * Detect the native bucket interval from server data by inspecting
 * the gaps between consecutive timestamps. Uses the median gap to be
 * robust against outliers (e.g. a single pair of timestamps 1s apart
 * in otherwise 1-minute data).
 * Returns 0 if undetectable (≤1 data point).
 */
export function detectNativeInterval(rawData) {
  if (!rawData || rawData.length < 2) return 0
  const sorted = rawData
    .map((item) => new Date(item.ts).getTime())
    .filter((ms) => Number.isFinite(ms))
    .sort((left, right) => left - right)
  const gaps = []
  for (let idx = 1; idx < sorted.length; idx += 1) {
    const gap = sorted[idx] - sorted[idx - 1]
    if (gap > 0) gaps.push(gap)
  }
  if (!gaps.length) return 0
  gaps.sort((left, right) => left - right)
  // Use median gap — robust against outliers from irregular data
  return gaps[Math.floor(gaps.length / 2)]
}

/**
 * Aggregate raw time-series data into fixed-size buckets.
 * Uses max(autoBucket, nativeDataInterval) to avoid visual gaps
 * when the server returns coarser resolution than the auto interval.
 * Returns { sortedKeys, bucketMap, bucketMs }
 */
export function aggregateIntoBuckets(rawData, rangeStart, rangeEnd, targetMaxBuckets) {
  const duration = rangeEnd - rangeStart
  const bucketMs = getBucketInterval(duration, targetMaxBuckets)
  const alignedStart = Math.floor(rangeStart / bucketMs) * bucketMs
  const bucketMap = new Map()

  // Only include buckets that fall ENTIRELY inside [rangeStart, rangeEnd].
  // Partial buckets at either edge would show a misleading low/dip:
  //   - First bucket aligned to `alignedStart < rangeStart` includes time
  //     before the range, with no data to fill it.
  //   - Last bucket whose end is past `rangeEnd` includes future time (or
  //     time after "now" for live data), also under-filled.
  // Skipping these eliminates the "starts low / ends low" visual artifact.
  const firstBucketTs = alignedStart < rangeStart ? alignedStart + bucketMs : alignedStart
  for (let ts = firstBucketTs; ts + bucketMs <= rangeEnd; ts += bucketMs) {
    bucketMap.set(ts, 0)
  }

  // Aggregate
  rawData.forEach((item) => {
    if (!item.ts) return
    const tsMs = new Date(item.ts).getTime()
    const key = Math.floor(tsMs / bucketMs) * bucketMs
    bucketMap.set(key, (bucketMap.get(key) || 0) + (item.count || 0))
  })

  const sortedKeys = Array.from(bucketMap.keys()).sort((left, right) => left - right)
  return { sortedKeys, bucketMap, bucketMs }
}

/**
 * Calculate a "nice" Y-axis maximum (1, 1.5, 2, 3, 5 pattern).
 * Uses tighter rounding to keep bars visually proportional.
 */
export function niceYMax(maxValue) {
  if (maxValue <= 0) return 5
  const magnitude = Math.pow(10, Math.floor(Math.log10(maxValue)))
  const normalized = maxValue / magnitude
  let multiplier = 10
  if (normalized <= 1) multiplier = 1
  else if (normalized <= 1.5) multiplier = 1.5
  else if (normalized <= 2) multiplier = 2
  else if (normalized <= 3) multiplier = 3
  else if (normalized <= 5) multiplier = 5
  else if (normalized <= 7) multiplier = 7
  return multiplier * magnitude
}

/**
 * Format a number for axis labels (compact: 1.2M, 3.4K).
 */
export function formatCompact(num) {
  if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B'
  if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M'
  if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K'
  if (num === 0) return '0'
  if (Math.abs(num) < 10) return Number(num.toFixed(2)).toString()
  if (Math.abs(num) < 100) return Number(num.toFixed(1)).toString()
  return String(Math.round(num))
}

/**
 * Format a number with full precision (1,234,567).
 */
export function formatDetailed(num) {
  return new Intl.NumberFormat('en-US').format(num)
}

/**
 * Format a Date respecting a timezone.
 */
export function formatInTimezone(date, opts, timezone) {
  try {
    return date.toLocaleString('en-US', { ...opts, timeZone: timezone }).replace(',', '')
  } catch {
    return date.toLocaleString('en-US', opts).replace(',', '')
  }
}

export { HOUR, DAY, MIN }
