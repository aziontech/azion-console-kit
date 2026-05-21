import { describe, it, expect } from 'vitest'
import fc from 'fast-check'
import { buildC3Config } from '../useChartBuilder'
import { CHART_KINDS } from '../chart-kinds'

/**
 * Feature: real-time-events-refactor, Property 10: C3 chart config structural validity
 *
 * Validates: Requirements 13.4, 13.11
 *
 * For any valid chart data array (with ts and numeric value columns) and any of
 * the 3 chart kinds, buildC3Config SHALL produce a non-null object with bindto,
 * data.columns (non-empty), data.type, axis.x, and axis.y properties.
 */

const ALL_CHART_KINDS = [
  CHART_KINDS.SINGLE_SERIES_HISTOGRAM,
  CHART_KINDS.STACKED_HISTOGRAM,
  CHART_KINDS.MULTI_SERIES_TIMESERIES
]

// Arbitrary: one of the 3 chart kinds
const arbChartKind = fc.constantFrom(...ALL_CHART_KINDS)

// Arbitrary: a time-label string (simulates formatted bucket labels)
const arbTimeLabel = fc
  .integer({ min: 0, max: 23 })
  .map((h) => `${String(h).padStart(2, '0')}:00`)

// Arbitrary: a series name (alphanumeric, non-empty)
const arbSeriesName = fc.stringMatching(/^[a-zA-Z][a-zA-Z0-9]{0,15}$/)

// Arbitrary: valid chart data with x column + at least 1 series column
const arbChartData = fc
  .record({
    numBuckets: fc.integer({ min: 2, max: 30 }),
    numSeries: fc.integer({ min: 1, max: 5 })
  })
  .chain(({ numBuckets, numSeries }) =>
    fc.record({
      timeLabels: fc.array(arbTimeLabel, {
        minLength: numBuckets,
        maxLength: numBuckets
      }),
      seriesNames: fc.array(arbSeriesName, {
        minLength: numSeries,
        maxLength: numSeries
      }),
      seriesValues: fc.array(
        fc.array(fc.integer({ min: 0, max: 10000 }), {
          minLength: numBuckets,
          maxLength: numBuckets
        }),
        { minLength: numSeries, maxLength: numSeries }
      )
    })
  )
  .map(({ timeLabels, seriesNames, seriesValues }) => {
    // Deduplicate series names to avoid collisions
    const uniqueNames = [...new Set(seriesNames)]
    const usedSeries = uniqueNames.slice(0, seriesValues.length)

    const xColumn = ['x', ...timeLabels]
    const dataColumns = usedSeries.map((name, i) => [name, ...seriesValues[i]])
    const columns = [xColumn, ...dataColumns]

    const allValues = seriesValues.flat()
    const maxValue = Math.max(0, ...allValues)

    return {
      columns,
      groups: [usedSeries],
      seriesNames: usedSeries,
      maxValue,
      tooltipLabels: timeLabels
    }
  })
  // Ensure at least 1 data column exists (after dedup)
  .filter((d) => d.seriesNames.length >= 1)

// Arbitrary: minimal chart config object
const arbChartConfig = fc.record({
  chartType: fc.constantFrom('bar', 'spline', 'area-spline', undefined),
  dataUnit: fc.constantFrom('count', 'milliseconds', 'percentage', 'bytes', undefined)
})

// A fake DOM element ref for bindto
const FAKE_CHART_REF = { tagName: 'DIV' }

describe('Feature: real-time-events-refactor, Property 10: C3 chart config structural validity', () => {
  it('buildC3Config produces a non-null object with required properties for any valid chart data and chart kind', () => {
    fc.assert(
      fc.property(arbChartData, arbChartKind, arbChartConfig, (chartData, chartKind, chartConfig) => {
        const result = buildC3Config({
          chartRef: FAKE_CHART_REF,
          chartData,
          chartConfig,
          chartKind
        })

        // Must be non-null
        expect(result).not.toBeNull()
        expect(typeof result).toBe('object')

        // Must have bindto
        expect(result).toHaveProperty('bindto')
        expect(result.bindto).toBe(FAKE_CHART_REF)

        // Must have data.columns (non-empty array)
        expect(result).toHaveProperty('data')
        expect(result.data).toHaveProperty('columns')
        expect(Array.isArray(result.data.columns)).toBe(true)
        expect(result.data.columns.length).toBeGreaterThan(0)

        // Must have data.type
        expect(result.data).toHaveProperty('type')
        expect(typeof result.data.type).toBe('string')

        // Must have axis.x
        expect(result).toHaveProperty('axis')
        expect(result.axis).toHaveProperty('x')
        expect(typeof result.axis.x).toBe('object')

        // Must have axis.y
        expect(result.axis).toHaveProperty('y')
        expect(typeof result.axis.y).toBe('object')
      }),
      { numRuns: 100 }
    )
  })
})
