import { describe, expect, it } from 'vitest'
import { CHART_RULES } from '@modules/real-time-metrics/constants'

describe('RealTimeMetricsModule', () => {
  describe('Chart rules constants', () => {
    it('should be defined', () => {
      expect(CHART_RULES).toBeDefined()
    })

    it('should have the correct key:value pairs', () => {
      const chartRules = {
        SERIES_LIMIT: 16,
        RESET_COUNT: 0,
        MIN_COUNT: 4,
        MAX_COUNT: 6,
        TO_FIXED_PERCENTAGE: 2,
        TO_FIXED_DATA_VOLUME: 1,
        SCREEN_SMALL_BREAKPOINT: 1024,
        SCREEN_XSMALL_BREAKPOINT: 540,
        MEAN_LINE_LABEL: 'Mean Line',
        DATA_VOLUME: {
          tera: 1e12,
          giga: 1073741824,
          mega: 1048576,
          kilo: 1024
        },
        C3_TYPES: {
          ts: 'timeseries',
          cat: 'category'
        },
        LABEL: {
          width: 40,
          defaultPosition: 'outer-center',
          rotatedPosition: 'outer-middle'
        },
        BOTTOM_LEGEND_PADDING: {
          bottom: 16,
          right: 30
        },
        BASE_COLOR_PATTERNS: [
          'var(--series-one-color)',
          'var(--series-two-color)',
          'var(--series-three-color)',
          'var(--series-four-color)',
          'var(--series-five-color)',
          'var(--series-six-color)',
          'var(--series-seven-color)',
          'var(--series-eight-color)',
          'var(--series-one-color)',
          'var(--series-two-color)',
          'var(--series-three-color)',
          'var(--series-four-color)',
          'var(--series-five-color)',
          'var(--series-six-color)',
          'var(--series-seven-color)',
          'var(--series-eight-color)'
        ],
        MEAN_LINE_PATTERN: 'var(--text-color)'
      }

      expect(CHART_RULES).toEqual(chartRules)
    })
  })
})
