/* eslint-disable id-length */
import { FormatC3GraphProps } from '@modules/real-time-metrics/chart'
import { describe, expect, it } from 'vitest'

const fixtures = {
  results: [
    [
      'ts',
      '2023-01-16T11:01:00.000Z',
      '2023-01-16T11:02:00.000Z',
      '2023-01-16T11:03:00.000Z',
      '2023-01-16T11:04:00.000Z',
      '2023-01-16T11:05:00.000Z',
      '2023-01-16T11:06:00.000Z',
      '2023-01-16T11:07:00.000Z',
      '2023-01-16T11:08:00.000Z',
      '2023-01-16T11:09:00.000Z',
      '2023-01-16T11:10:00.000Z',
      '2023-01-16T11:11:00.000Z',
      '2023-01-16T11:12:00.000Z',
      '2023-01-16T11:13:00.000Z',
      '2023-01-16T11:14:00.000Z',
      '2023-01-16T11:15:00.000Z',
      '2023-01-16T11:16:00.000Z'
    ],
    ['serieTest1', 61, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    ['serieTest2', 0, 65, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    ['serieTest3', 0, 0, 61, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    ['serieTest4', 0, 0, 0, 66, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    ['serieTest5', 0, 0, 0, 0, 61, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    ['serieTest6', 0, 0, 0, 0, 0, 65, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    ['serieTest7', 0, 0, 0, 0, 0, 0, 60, 0, 0, 0, 0, 0, 0, 0, 0],
    ['serieTest8', 0, 0, 0, 0, 0, 0, 0, 65, 0, 0, 0, 0, 0, 0, 0],
    ['serieTest9', 0, 0, 0, 0, 0, 0, 0, 0, 63, 0, 0, 0, 0, 0, 0],
    ['serieTest10', 0, 0, 0, 0, 0, 0, 0, 0, 0, 65, 0, 0, 0, 0, 0],
    ['serieTest11', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 60, 0, 0, 0, 0],
    ['serieTest12', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 66, 0, 0, 0],
    ['serieTest13', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 65, 0, 0],
    ['serieTest14', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 65, 0],
    ['serieTest15', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 61],
    ['serieTest16', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 66]
  ],
  linePatterns: [
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
  ]
}

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
        isTopX: false,
        rotated: false,
        dataUnit: 'perSecond',
        aggregationType: 'sum'
      }
      const resultChart = fixtures.results

      const expected = {
        data: {
          x: 'ts',
          type: 'line',
          columns: fixtures.results,
          xFormat: '%Y-%m-%dT%H:%M:%S.%LZ',
          names: {
            serieTest1: 'Serie Test 1 - 61/s',
            serieTest2: 'Serie Test 2 - 65/s',
            serieTest3: 'Serie Test 3 - 61/s',
            serieTest4: 'Serie Test 4 - 66/s',
            serieTest5: 'Serie Test 5 - 61/s',
            serieTest6: 'Serie Test 6 - 65/s',
            serieTest7: 'Serie Test 7 - 60/s',
            serieTest8: 'Serie Test 8 - 65/s',
            serieTest9: 'Serie Test 9 - 63/s',
            serieTest10: 'Serie Test 10 - 65/s',
            serieTest11: 'Serie Test 11 - 60/s',
            serieTest12: 'Serie Test 12 - 66/s',
            serieTest13: 'Serie Test 13 - 65/s',
            serieTest14: 'Serie Test 14 - 65/s',
            serieTest15: 'Serie Test 15 - 61/s',
            serieTest16: 'Serie Test 16 - 66/s'
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
            padding: { bottom: 0 }
          }
        },
        legend: {
          position: 'right'
        },
        padding: null,
        color: {
          pattern: fixtures.linePatterns
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

      const resultChart = fixtures.results

      const expected = {
        data: {
          x: 'ts',
          type: 'bar',
          columns: fixtures.results,
          xFormat: '%Y-%m-%dT%H:%M:%S.%LZ',
          names: {
            serieTest1: 'Serie Test 1 - 4.07%',
            serieTest2: 'Serie Test 2 - 4.33%',
            serieTest3: 'Serie Test 3 - 4.07%',
            serieTest4: 'Serie Test 4 - 4.40%',
            serieTest5: 'Serie Test 5 - 4.07%',
            serieTest6: 'Serie Test 6 - 4.33%',
            serieTest7: 'Serie Test 7 - 4.00%',
            serieTest8: 'Serie Test 8 - 4.33%',
            serieTest9: 'Serie Test 9 - 4.20%',
            serieTest10: 'Serie Test 10 - 4.33%',
            serieTest11: 'Serie Test 11 - 4.00%',
            serieTest12: 'Serie Test 12 - 4.40%',
            serieTest13: 'Serie Test 13 - 4.33%',
            serieTest14: 'Serie Test 14 - 4.33%',
            serieTest15: 'Serie Test 15 - 4.07%',
            serieTest16: 'Serie Test 16 - 4.13%'
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
          pattern: fixtures.linePatterns
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

      const resultChart = fixtures.results

      const expected = {
        data: {
          x: 'ts',
          type: 'spline',
          columns: fixtures.results,
          xFormat: '%Y-%m-%dT%H:%M:%S.%LZ',
          names: {
            serieTest1: 'Serie Test 1 - 61.0bit/s',
            serieTest2: 'Serie Test 2 - 65.0bit/s',
            serieTest3: 'Serie Test 3 - 61.0bit/s',
            serieTest4: 'Serie Test 4 - 66.0bit/s',
            serieTest5: 'Serie Test 5 - 61.0bit/s',
            serieTest6: 'Serie Test 6 - 65.0bit/s',
            serieTest7: 'Serie Test 7 - 60.0bit/s',
            serieTest8: 'Serie Test 8 - 65.0bit/s',
            serieTest9: 'Serie Test 9 - 63.0bit/s',
            serieTest10: 'Serie Test 10 - 65.0bit/s',
            serieTest11: 'Serie Test 11 - 60.0bit/s',
            serieTest12: 'Serie Test 12 - 66.0bit/s',
            serieTest13: 'Serie Test 13 - 65.0bit/s',
            serieTest14: 'Serie Test 14 - 65.0bit/s',
            serieTest15: 'Serie Test 15 - 61.0bit/s',
            serieTest16: 'Serie Test 16 - 66.0bit/s'
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
          pattern: fixtures.linePatterns
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
