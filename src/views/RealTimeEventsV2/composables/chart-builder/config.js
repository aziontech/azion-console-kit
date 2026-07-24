// ────────────────────────────────────────────────────────────────────────────
// CONFIG concern — assemble the final C3.js config from prepared chart data.
//
// Extracted verbatim from useChartBuilder.js (task 7.5). Consumes the scaling
// concern (tick decimation) and the formatting concern (bytes/detailed values),
// plus the chart-kind dispatch. No behavior change to chart output.
// ────────────────────────────────────────────────────────────────────────────

import { niceYMax, formatCompact, formatDetailed } from '../../utils/chart-bucketing'
import { CHART_KINDS } from '../chart-kinds'
import { formatBytes } from './formatting'
import { computeTickPatch } from './scaling'

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
  const naturalTicks = Array.isArray(columns[0]) && columns[0].length > 1 ? columns[0].slice(1) : []
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
    // Left padding sized by the WIDEST Y tick label (≈6.8px/char at the 11px
    // tick font + 12px gutter), not by viewport: the fixed 35px mobile value
    // clipped "100.0M" to "00.0M". Clamped so sparse/huge labels stay sane.
    padding: {
      left: Math.min(64, Math.max(35, formatCompact(yMax ?? maxValue ?? 0).length * 6.8 + 12)),
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
