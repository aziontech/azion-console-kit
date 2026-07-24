// ────────────────────────────────────────────────────────────────────────────
// FORMATTING concern — value + axis/tooltip label formatting for the chart.
//
// Extracted verbatim from useChartBuilder.js (task 7.5). No behavior change:
// these are the same pure helpers the builder relied on, moved into a focused
// module so the config/pivot/scaling concerns can import them without dragging
// the whole builder along.
// ────────────────────────────────────────────────────────────────────────────

import { formatInTimezone, DAY, MIN } from '../../utils/chart-bucketing'

export function formatBytes(bytes) {
  if (bytes === 0) return '0 B'
  const kilobyte = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const sizeIndex = Math.floor(Math.log(Math.abs(bytes)) / Math.log(kilobyte))
  return `${(bytes / Math.pow(kilobyte, sizeIndex)).toFixed(2)} ${sizes[sizeIndex] || 'B'}`
}

// Breakpoints where multi-part date labels (`MM/dd HH:mm`) get truncated to
// just the date half to keep the X-axis legible on narrow screens.
const NARROW_LABEL_BREAKPOINTS = new Set(['mobile-s', 'mobile'])

export function formatLabel(date, duration, tz, bucketMs = MIN, breakpoint = 'desktop') {
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

export function formatTooltipRange(start, end, duration, tz) {
  const fmt =
    duration > 7 * DAY
      ? { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }
      : { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }
  return `${formatInTimezone(start, fmt, tz)} - ${formatInTimezone(end, fmt, tz)}`
}
