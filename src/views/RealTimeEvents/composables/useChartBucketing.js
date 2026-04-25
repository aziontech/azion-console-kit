/**
 * Chart bucketing logic for event histograms.
 *
 * Lookup table mapping time ranges to bucket intervals.
 * Each entry: [maxRange, bucketInterval].
 * The first entry whose maxRange >= durationMs wins.
 *
 * Examples:
 *   1 min  → 1s     5 min  → 5s     15 min → 10s    30 min → 30s
 *   1 h    → 1m     3 h    → 5m     6 h    → 10m    12 h   → 30m
 *   24 h   → 30m    2 d    → 1h     7 d    → 3h     14 d   → 12h
 *   30 d   → 12h
 */

const SEC = 1000
const MIN = 60 * SEC
const HOUR = 60 * MIN
const DAY = 24 * HOUR

const BUCKET_TABLE = [
  [1 * MIN, 1 * SEC],       // 1 min  → 1s   (60 buckets)
  [5 * MIN, 5 * SEC],       // 5 min  → 5s   (60 buckets)
  [15 * MIN, 10 * SEC],     // 15 min → 10s  (90 buckets)
  [30 * MIN, 30 * SEC],     // 30 min → 30s  (60 buckets)
  [1 * HOUR, 1 * MIN],      // 1 h    → 1m   (60 buckets)
  [3 * HOUR, 5 * MIN],      // 3 h    → 5m   (36 buckets)
  [6 * HOUR, 10 * MIN],     // 6 h    → 10m  (36 buckets)
  [12 * HOUR, 30 * MIN],    // 12 h   → 30m  (24 buckets)
  [1 * DAY, 30 * MIN],      // 24 h   → 30m  (48 buckets)
  [2 * DAY, 1 * HOUR],      // 2 d    → 1h   (48 buckets)
  [7 * DAY, 3 * HOUR],      // 7 d    → 3h   (56 buckets)
  [14 * DAY, 12 * HOUR],    // 14 d   → 12h  (28 buckets)
  [30 * DAY, 12 * HOUR],    // 30 d   → 12h  (60 buckets)
  [90 * DAY, 1 * DAY],      // 90 d   → 1d   (90 buckets)
  [365 * DAY, 7 * DAY],     // 365 d  → 7d   (52 buckets)
  [Infinity, 30 * DAY]
]

export function getBucketInterval(durationMs) {
  for (const [maxRange, interval] of BUCKET_TABLE) {
    if (durationMs <= maxRange) return interval
  }
  return 30 * DAY
}

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
export function aggregateIntoBuckets(rawData, rangeStart, rangeEnd) {
  const duration = rangeEnd - rangeStart
  const bucketMs = getBucketInterval(duration)
  const alignedStart = Math.floor(rangeStart / bucketMs) * bucketMs
  const bucketMap = new Map()

  // Pre-fill slots — stop BEFORE rangeEnd to avoid an incomplete trailing
  // bucket that would show a visual drop to near-zero.
  for (let ts = alignedStart; ts < rangeEnd; ts += bucketMs) {
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
 * Calculate a "nice" Y-axis maximum (1, 2, 5 pattern).
 */
export function niceYMax(maxValue) {
  if (maxValue <= 0) return 5
  const magnitude = Math.pow(10, Math.floor(Math.log10(maxValue)))
  const normalized = maxValue / magnitude
  let multiplier = 10
  if (normalized <= 1) multiplier = 1
  else if (normalized <= 2) multiplier = 2
  else if (normalized <= 5) multiplier = 5
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
