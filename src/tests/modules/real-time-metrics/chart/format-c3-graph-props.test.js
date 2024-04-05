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
          type: 'line',
          columns: FIXTURES.COLUMNS_WITH_MEAN_LINE,
          xFormat: '%Y-%m-%dT%H:%M:%S.%LZ',
          names: {
            serieTest1: 'Serie Test 1 - 610B/s',
            serieTest2: 'Serie Test 2 - 65B/s',
            serieTest3: 'Serie Test 3 - 6.1B/s',
            serieTest4: 'Serie Test 4 - 660M/s',
            serieTest5: 'Serie Test 5 - 61M/s',
            serieTest6: 'Serie Test 6 - 6.5M/s',
            serieTest7: 'Serie Test 7 - 60K/s',
            serieTest8: 'Serie Test 8 - 6.5K/s',
            serieTest9: 'Serie Test 9 - 630/s',
            serieTest10: 'Serie Test 10 - 65/s',
            serieTest11: 'Serie Test 11 - 6/s',
            serieTest12: 'Serie Test 12 - 0.66/s',
            serieTest13: 'Serie Test 13 - 0.065/s',
            serieTest14: 'Serie Test 14 - 0.0065/s',
            serieTest15: 'Serie Test 15 - 0.00061/s',
            serieTest16: 'Serie Test 16 - 0.000066/s',
            'Mean Line': 'Mean Line - 2.8B/s'
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
          position: 'right'
        },
        padding: null,
        color: {
          pattern: FIXTURES.LINE_PATTERNS_WITH_MEAN_LINE
        },
        grid: {
          y: {
            show: true
          }
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
          type: 'bar',
          columns: FIXTURES.COLUMNS_WITH_MEAN_LINE_PER_SERIES,
          xFormat: '%Y-%m-%dT%H:%M:%S.%LZ',
          names: {
            serieTest1: 'Serie Test 1 - 40,666,666,666.67%',
            'Mean Line - Serie Test 1': 'Mean Line - Serie Test 1 - 2,711,111,111.11%',
            serieTest2: 'Serie Test 2 - 4,333,333,333.33%',
            'Mean Line - Serie Test 2': 'Mean Line - Serie Test 2 - 288,888,888.89%',
            serieTest3: 'Serie Test 3 - 406,666,666.67%',
            'Mean Line - Serie Test 3': 'Mean Line - Serie Test 3 - 27,111,111.11%',
            serieTest4: 'Serie Test 4 - 44,000,000.00%',
            'Mean Line - Serie Test 4': 'Mean Line - Serie Test 4 - 2,933,333.33%',
            serieTest5: 'Serie Test 5 - 4,066,666.67%',
            'Mean Line - Serie Test 5': 'Mean Line - Serie Test 5 - 271,111.11%',
            serieTest6: 'Serie Test 6 - 433,333.33%',
            'Mean Line - Serie Test 6': 'Mean Line - Serie Test 6 - 28,888.89%',
            serieTest7: 'Serie Test 7 - 4,000.00%',
            'Mean Line - Serie Test 7': 'Mean Line - Serie Test 7 - 266.67%',
            serieTest8: 'Serie Test 8 - 433.33%',
            'Mean Line - Serie Test 8': 'Mean Line - Serie Test 8 - 28.89%',
            serieTest9: 'Serie Test 9 - 42.00%',
            'Mean Line - Serie Test 9': 'Mean Line - Serie Test 9 - 2.80%',
            serieTest10: 'Serie Test 10 - 4.33%',
            'Mean Line - Serie Test 10': 'Mean Line - Serie Test 10 - 0.29%',
            serieTest11: 'Serie Test 11 - 0.40%',
            'Mean Line - Serie Test 11': 'Mean Line - Serie Test 11 - 0.03%',
            serieTest12: 'Serie Test 12 - 0.04%',
            'Mean Line - Serie Test 12': 'Mean Line - Serie Test 12 - 0.00%',
            serieTest13: 'Serie Test 13 - 0.00%',
            'Mean Line - Serie Test 13': 'Mean Line - Serie Test 13 - 0.00%',
            serieTest14: 'Serie Test 14 - 0.00%',
            'Mean Line - Serie Test 14': 'Mean Line - Serie Test 14 - 0.00%',
            serieTest15: 'Serie Test 15 - 0.00%',
            'Mean Line - Serie Test 15': 'Mean Line - Serie Test 15 - 0.00%',
            serieTest16: 'Serie Test 16 - 0.00%',
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
          position: 'right'
        },
        padding: null,
        color: {
          pattern: FIXTURES.LINE_PATTERNS_WITH_MEAN_LINE_PER_SERIES
        },
        grid: {
          y: {
            show: true
          }
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
          type: 'spline',
          columns: FIXTURES.RESULTS,
          xFormat: '%Y-%m-%dT%H:%M:%S.%LZ',
          names: {
            serieTest1: 'Serie Test 1 - 568.1Gb/s',
            serieTest2: 'Serie Test 2 - 60.5Gb/s',
            serieTest3: 'Serie Test 3 - 5.7Gb/s',
            serieTest4: 'Serie Test 4 - 629.4Mb/s',
            serieTest5: 'Serie Test 5 - 58.2Mb/s',
            serieTest6: 'Serie Test 6 - 6.2Mb/s',
            serieTest7: 'Serie Test 7 - 58.6kb/s',
            serieTest8: 'Serie Test 8 - 6.3kb/s',
            serieTest9: 'Serie Test 9 - 630.0bit/s',
            serieTest10: 'Serie Test 10 - 65.0bit/s',
            serieTest11: 'Serie Test 11 - 6.0bit/s',
            serieTest12: 'Serie Test 12 - 0.7bit/s',
            serieTest13: 'Serie Test 13 - 0.1bit/s',
            serieTest14: 'Serie Test 14 - 0.0bit/s',
            serieTest15: 'Serie Test 15 - 0.0bit/s',
            serieTest16: 'Serie Test 16 - 0.0bit/s'
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
          position: 'right'
        },
        padding: null,
        color: {
          pattern: FIXTURES.LINE_PATTERNS
        },
        grid: {
          y: {
            show: true
          }
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
