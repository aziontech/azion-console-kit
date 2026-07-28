// ────────────────────────────────────────────────────────────────────────────
// SCALING concern — viewport-aware X-axis tick decimation + label measurement.
//
// Extracted verbatim from useChartBuilder.js (task 7.5): the off-screen label
// measurement, its bounded fallback cache, the format-key fingerprint, and the
// tick-patch computation. No behavior change. `AXIS_FONT_SIZE_PX` is re-exported
// so callers (buildC3Config) keep passing the same font size into the cache.
// ────────────────────────────────────────────────────────────────────────────

import { pickEvenlyDistributed } from '../utils/pickEvenlyDistributed'

export const AXIS_FONT_SIZE_PX = 11
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
export function computeTickPatch({ naturalTicks, containerWidth, breakpoint, axisProbe, cache }) {
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
  const longestChars = naturalTicks.reduce((max, label) => Math.max(max, String(label).length), 0)
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
    const rotate =
      isRotatableBreakpoint && containerWidth / naturalTicks.length < slotWidth ? -45 : 0
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
  const rotate = isRotatableBreakpoint && containerWidth / values.length < slotWidth ? -45 : 0

  return { values, fit: false, rotate }
}
