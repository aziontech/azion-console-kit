/* eslint-disable id-length */
import { FormatC3GraphProps } from '@modules/real-time-metrics/chart'
import { describe, expect, it } from 'vitest'
import * as FIXTURES from './chart-fixtures'

describe('RealTimeMetricsModule', () => {
  describe('C3 chart methods', () => {
    it('should be defined', () => {
      expect(FormatC3GraphProps).toBeDefined()
    })

    it('should format the report data to C3 chart of type line', () => {
      const chartData = {
        id: '123456',
        type: 'line',
        columns: 6,
        xAxis: 'ts',
        maxYAxis: 100,
        isTopX: false,
        rotated: false,
        dataUnit: 'perSecond',
        aggregationType: 'sum'
      }
      const resultChart = FIXTURES.RESULTS

      const expected = {
        data: {
          x: 'ts',
          columns: FIXTURES.COLUMNS_WITH_MEAN_LINE,
          type: 'line',
          xFormat: '%Y-%m-%dT%H:%M:%S.%LZ',
          names: {
            serieTest1: 'Serie Test 1 - 6100T/s',
            serieTest2: 'Serie Test 2 - 650T/s',
            serieTest3: 'Serie Test 3 - 61T/s',
            serieTest4: 'Serie Test 4 - 6.6T/s',
            serieTest5: 'Serie Test 5 - 610B/s',
            serieTest6: 'Serie Test 6 - 65B/s',
            serieTest7: 'Serie Test 7 - 600M/s',
            serieTest8: 'Serie Test 8 - 65M/s',
            serieTest9: 'Serie Test 9 - 6.3M/s',
            serieTest10: 'Serie Test 10 - 650K/s',
            serieTest11: 'Serie Test 11 - 60K/s',
            serieTest12: 'Serie Test 12 - 66K/s',
            serieTest13: 'Serie Test 13 - 6.5K/s',
            serieTest14: 'Serie Test 14 - 650/s',
            serieTest15: 'Serie Test 15 - 6.1/s',
            serieTest16: 'Serie Test 16 - 0.66/s',
            'Mean Line': 'Mean Line - 28T/s'
          }
        },
        axis: {
          rotated: false,
          x: {
            type: 'timeseries',
            tick: {
              count: 4,
              outer: false,
              format: '%b-%d %H:%M',
              width: 40
            }
          },
          y: {
            tick: {
              count: 6,
              format: () => 'c3 tick function'
            },
            min: 0,
            padding: { bottom: 0, top: 0 },
            max: 100
          }
        },
        legend: {
          position: 'right',
          hide: false
        },
        padding: null,
        color: {
          pattern: FIXTURES.BASE_COLOR_PATTERNS_WITH_MEAN_LINE
        },
        grid: {
          y: { show: true },
          focus: { show: true }
        },
        point: {
          show: false
        },
        tooltip: {
          show: true,
          format: {
            title: () => 'c3 title function'
          },
          contents: () => 'c3 contents function'
        },
        zoom: {
          enabled: true
        }
      }

      const result = FormatC3GraphProps({
        chartData,
        resultChart,
        hasMeanLineTotal: true
      })

      expect(JSON.stringify(result)).toEqual(JSON.stringify(expected))
    })

    it('should format the report data to C3 chart of type bar', () => {
      const chartData = {
        id: '235463',
        type: 'bar',
        columns: 6,
        xAxis: 'ts',
        isTopX: false,
        rotated: true,
        dataUnit: 'percentage',
        aggregationType: 'avg'
      }

      const resultChart = FIXTURES.RESULTS

      const expected = {
        data: {
          x: 'ts',
          columns: FIXTURES.COLUMNS_WITH_MEAN_LINE_PER_SERIES,
          type: 'bar',
          xFormat: '%Y-%m-%dT%H:%M:%S.%LZ',
          names: {
            serieTest1: 'Serie Test 1 - 406,666,666,666,666.70%',
            'Mean Line - Serie Test 1': 'Mean Line - Serie Test 1 - 27,111,111,111,111.12%',
            serieTest2: 'Serie Test 2 - 43,333,333,333,333.34%',
            'Mean Line - Serie Test 2': 'Mean Line - Serie Test 2 - 2,888,888,888,888.89%',
            serieTest3: 'Serie Test 3 - 4,066,666,666,666.67%',
            'Mean Line - Serie Test 3': 'Mean Line - Serie Test 3 - 271,111,111,111.11%',
            serieTest4: 'Serie Test 4 - 440,000,000,000.00%',
            'Mean Line - Serie Test 4': 'Mean Line - Serie Test 4 - 29,333,333,333.33%',
            serieTest5: 'Serie Test 5 - 40,666,666,666.67%',
            'Mean Line - Serie Test 5': 'Mean Line - Serie Test 5 - 2,711,111,111.11%',
            serieTest6: 'Serie Test 6 - 4,333,333,333.33%',
            'Mean Line - Serie Test 6': 'Mean Line - Serie Test 6 - 288,888,888.89%',
            serieTest7: 'Serie Test 7 - 40,000,000.00%',
            'Mean Line - Serie Test 7': 'Mean Line - Serie Test 7 - 2,666,666.67%',
            serieTest8: 'Serie Test 8 - 4,333,333.33%',
            'Mean Line - Serie Test 8': 'Mean Line - Serie Test 8 - 288,888.89%',
            serieTest9: 'Serie Test 9 - 420,000.00%',
            'Mean Line - Serie Test 9': 'Mean Line - Serie Test 9 - 28,000.00%',
            serieTest10: 'Serie Test 10 - 43,333.33%',
            'Mean Line - Serie Test 10': 'Mean Line - Serie Test 10 - 2,888.89%',
            serieTest11: 'Serie Test 11 - 4,000.00%',
            'Mean Line - Serie Test 11': 'Mean Line - Serie Test 11 - 266.67%',
            serieTest12: 'Serie Test 12 - 4,400.00%',
            'Mean Line - Serie Test 12': 'Mean Line - Serie Test 12 - 293.33%',
            serieTest13: 'Serie Test 13 - 433.33%',
            'Mean Line - Serie Test 13': 'Mean Line - Serie Test 13 - 28.89%',
            serieTest14: 'Serie Test 14 - 43.33%',
            'Mean Line - Serie Test 14': 'Mean Line - Serie Test 14 - 2.89%',
            serieTest15: 'Serie Test 15 - 0.41%',
            'Mean Line - Serie Test 15': 'Mean Line - Serie Test 15 - 0.03%',
            serieTest16: 'Serie Test 16 - 0.04%',
            'Mean Line - Serie Test 16': 'Mean Line - Serie Test 16 - 0.00%'
          }
        },
        axis: {
          rotated: true,
          x: {
            type: 'timeseries',
            tick: {
              count: 4,
              outer: false,
              format: '%b-%d %H:%M',
              width: 40
            }
          },
          y: {
            tick: {
              count: 6,
              format: () => 'c3 tick function'
            },
            padding: { bottom: 0 }
          }
        },
        legend: {
          position: 'right',
          hide: false
        },
        padding: null,
        color: {
          pattern: FIXTURES.BASE_COLOR_PATTERNS_WITH_MEAN_LINE_PER_SERIES
        },
        grid: {
          y: { show: true },
          focus: { show: true }
        },
        point: {
          show: false
        },
        tooltip: {
          show: true,
          format: {
            title: () => 'c3 title function'
          },
          contents: () => 'c3 contents function'
        },
        zoom: {
          enabled: true
        }
      }

      const result = FormatC3GraphProps({
        chartData,
        resultChart,
        hasMeanLineSeries: true
      })

      expect(JSON.stringify(result)).toEqual(JSON.stringify(expected))
    })

    it('should format the report data to C3 chart of type spline', () => {
      const chartData = {
        id: '235463',
        type: 'spline',
        columns: 6,
        xAxis: 'ts',
        isTopX: false,
        rotated: true,
        dataUnit: 'bitsPerSecond',
        aggregationType: 'sum'
      }

      const resultChart = FIXTURES.RESULTS

      const expected = {
        data: {
          x: 'ts',
          columns: FIXTURES.RESULTS,
          type: 'spline',
          xFormat: '%Y-%m-%dT%H:%M:%S.%LZ',
          names: {
            serieTest1: 'Serie Test 1 - 6.1KTb/s',
            serieTest2: 'Serie Test 2 - 650.0Tb/s',
            serieTest3: 'Serie Test 3 - 61.0Tb/s',
            serieTest4: 'Serie Test 4 - 6.6Tb/s',
            serieTest5: 'Serie Test 5 - 568.1Gb/s',
            serieTest6: 'Serie Test 6 - 60.5Gb/s',
            serieTest7: 'Serie Test 7 - 572.2Mb/s',
            serieTest8: 'Serie Test 8 - 62.0Mb/s',
            serieTest9: 'Serie Test 9 - 6.0Mb/s',
            serieTest10: 'Serie Test 10 - 634.8kb/s',
            serieTest11: 'Serie Test 11 - 58.6kb/s',
            serieTest12: 'Serie Test 12 - 64.5kb/s',
            serieTest13: 'Serie Test 13 - 6.3kb/s',
            serieTest14: 'Serie Test 14 - 650.0bit/s',
            serieTest15: 'Serie Test 15 - 6.1bit/s',
            serieTest16: 'Serie Test 16 - 0.7bit/s'
          }
        },
        axis: {
          rotated: true,
          x: {
            type: 'timeseries',
            tick: {
              count: 4,
              outer: false,
              format: '%b-%d %H:%M',
              width: 40
            }
          },
          y: {
            tick: {
              count: 6,
              format: () => 'c3 tick function'
            },
            padding: { bottom: 0 }
          }
        },
        legend: {
          position: 'right',
          hide: false
        },
        padding: null,
        color: {
          pattern: FIXTURES.BASE_COLOR_PATTERNS
        },
        grid: {
          y: { show: true },
          focus: { show: true }
        },
        point: {
          show: false
        },
        tooltip: {
          show: true,
          format: {
            title: () => 'c3 title function'
          },
          contents: () => 'c3 contents function'
        },
        zoom: {
          enabled: true
        }
      }

      const result = FormatC3GraphProps({
        chartData,
        resultChart
      })

      expect(JSON.stringify(result)).toEqual(JSON.stringify(expected))
    })
  })
})
