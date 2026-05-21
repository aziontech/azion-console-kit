/**
 * Unit tests for the tooltip.position callback wired in buildC3Config.
 *
 * These tests call buildC3Config directly with a mock chartContainer and
 * verify that the returned position function delegates to computeTooltipPosition
 * correctly — specifically the edge-flip behaviour (Requirement 7.2, 7.8).
 */
import { describe, it, expect } from 'vitest'
import { buildC3Config } from '../../../composables/useChartBuilder'
import { CHART_KINDS } from '../../../composables/chart-kinds'

/**
 * Minimal chartData that makes buildC3Config return a non-null config.
 * Uses a single-series histogram with two data points.
 */
const makeChartData = () => ({
  columns: [
    ['x', '00:00', '00:01'],
    ['count', 10, 20]
  ],
  groups: [['count']],
  seriesNames: ['count'],
  maxValue: 20,
  tooltipLabels: ['00:00 - 00:01', '00:01 - 00:02']
})

/**
 * Minimal chartConfig that satisfies buildC3Config's config?.dataUnit access.
 */
const makeChartConfig = () => ({
  chartType: 'bar',
  dataUnit: 'count'
})

/**
 * Create a mock DOM element whose getBoundingClientRect returns the given rect.
 */
const mockElement = (rect) => ({
  getBoundingClientRect: () => ({ ...rect })
})

describe('buildC3Config tooltip.position callback', () => {
  // Container: narrow 300×200 box anchored at viewport origin
  const containerRect = { left: 0, top: 0, width: 300, height: 200, right: 300, bottom: 200 }
  const chartContainer = mockElement(containerRect)

  const tooltipWidth = 80
  const tooltipHeight = 60

  it('returns a config with a tooltip.position function when chartContainer is provided', () => {
    const config = buildC3Config({
      chartRef: document.createElement('div'),
      chartData: makeChartData(),
      chartConfig: makeChartConfig(),
      chartKind: CHART_KINDS.SINGLE_SERIES_HISTOGRAM,
      chartContainer
    })

    expect(config).not.toBeNull()
    expect(typeof config.tooltip.position).toBe('function')
  })

  it('does NOT include tooltip.position when chartContainer is not provided', () => {
    const config = buildC3Config({
      chartRef: document.createElement('div'),
      chartData: makeChartData(),
      chartConfig: makeChartConfig(),
      chartKind: CHART_KINDS.SINGLE_SERIES_HISTOGRAM
      // chartContainer omitted — backward-compat path
    })

    expect(config).not.toBeNull()
    expect(config.tooltip.position).toBeUndefined()
  })

  it('flips tooltip to the LEFT of a bar near the right edge', () => {
    // Bar near the right edge: left=260, right=280 (only 20px from container right=300)
    const rightBarElement = mockElement({
      left: 260,
      top: 50,
      width: 20,
      height: 100,
      right: 280,
      bottom: 150
    })

    const config = buildC3Config({
      chartRef: document.createElement('div'),
      chartData: makeChartData(),
      chartConfig: makeChartConfig(),
      chartKind: CHART_KINDS.SINGLE_SERIES_HISTOGRAM,
      chartContainer
    })

    const { left } = config.tooltip.position(null, tooltipWidth, tooltipHeight, rightBarElement)

    // Tooltip should be flipped to the left of the bar (left < bar.left=260)
    expect(left).toBeLessThan(260)
  })

  it('places tooltip to the RIGHT of a bar in the middle of the container', () => {
    // Bar in the middle: left=130, right=150 — plenty of room on both sides
    const middleBarElement = mockElement({
      left: 130,
      top: 50,
      width: 20,
      height: 100,
      right: 150,
      bottom: 150
    })

    const config = buildC3Config({
      chartRef: document.createElement('div'),
      chartData: makeChartData(),
      chartConfig: makeChartConfig(),
      chartKind: CHART_KINDS.SINGLE_SERIES_HISTOGRAM,
      chartContainer
    })

    const { left } = config.tooltip.position(null, tooltipWidth, tooltipHeight, middleBarElement)

    // Tooltip should stay to the right of the bar (left > bar.right=150)
    expect(left).toBeGreaterThan(150)
  })

  it('keeps the tooltip within container bounds for the right-edge bar', () => {
    const rightBarElement = mockElement({
      left: 260,
      top: 50,
      width: 20,
      height: 100,
      right: 280,
      bottom: 150
    })

    const config = buildC3Config({
      chartRef: document.createElement('div'),
      chartData: makeChartData(),
      chartConfig: makeChartConfig(),
      chartKind: CHART_KINDS.SINGLE_SERIES_HISTOGRAM,
      chartContainer
    })

    const { left, top } = config.tooltip.position(null, tooltipWidth, tooltipHeight, rightBarElement)
    const padding = 8

    // left must be within container bounds
    expect(left).toBeGreaterThanOrEqual(padding)
    expect(left + tooltipWidth).toBeLessThanOrEqual(containerRect.width - padding)

    // top must be within container bounds
    expect(top).toBeGreaterThanOrEqual(padding)
    expect(top + tooltipHeight).toBeLessThanOrEqual(containerRect.height - padding)
  })

  it('keeps the tooltip within container bounds for the middle bar', () => {
    const middleBarElement = mockElement({
      left: 130,
      top: 50,
      width: 20,
      height: 100,
      right: 150,
      bottom: 150
    })

    const config = buildC3Config({
      chartRef: document.createElement('div'),
      chartData: makeChartData(),
      chartConfig: makeChartConfig(),
      chartKind: CHART_KINDS.SINGLE_SERIES_HISTOGRAM,
      chartContainer
    })

    const { left, top } = config.tooltip.position(null, tooltipWidth, tooltipHeight, middleBarElement)
    const padding = 8

    expect(left).toBeGreaterThanOrEqual(padding)
    expect(left + tooltipWidth).toBeLessThanOrEqual(containerRect.width - padding)
    expect(top).toBeGreaterThanOrEqual(padding)
    expect(top + tooltipHeight).toBeLessThanOrEqual(containerRect.height - padding)
  })
})
