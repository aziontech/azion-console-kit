const FIXTURES = {
  allFilters: {
    params: {
      data: {
        httpMetrics: [
          {
            edgeRequestsTotal: 61,
            ts: '2023-01-16T11:01:00Z',
            requestMethod: 'GET'
          },
          {
            edgeRequestsTotal: 65,
            ts: '2023-01-16T11:02:00Z',
            requestMethod: 'GET'
          }
        ]
      },
      dataset: 'httpMetrics',
      variable: null,
      aggregation: null,
      groupBy: ['ts', 'requestMethod'],
      isTopX: false,
      xAxis: 'ts',
      additionalSeries: ['edgeRequestsTotal'],
      userUTC: '0'
    },
    result: [
      ['ts', new Date('2023-01-16T11:01:00'), new Date('2023-01-16T11:02:00')],
      ['2023-01-16T11:01:00Z - GET', 61],
      ['2023-01-16T11:02:00Z - GET', 0, 65]
    ]
  },
  isTopX: {
    params: {
      data: {
        httpMetrics: [
          {
            edgeRequestsTotal: 61,
            ts: '2023-01-16T11:01:00Z',
            requestMethod: 'GET'
          },
          {
            edgeRequestsTotal: 65,
            ts: '2023-01-16T11:02:00Z',
            requestMethod: 'GET'
          }
        ]
      },
      dataset: 'httpMetrics',
      variable: null,
      aggregation: null,
      groupBy: ['ts', 'requestMethod'],
      isTopX: true,
      xAxis: 'ts',
      additionalSeries: ['edgeRequestsTotal'],
      userUTC: '0'
    },
    result: [
      ['ts', '2023-01-16T11:01:00Z', '2023-01-16T11:02:00Z'],
      ['edgeRequestsTotal', 61, 65]
    ]
  },
  withVariable: {
    params: {
      data: {
        httpMetrics: [
          {
            avg: 20.333333333333332,
            ts: '2023-01-16T11:01:00Z'
          },
          {
            avg: 21.666666666666668,
            ts: '2023-01-16T11:01:00Z'
          }
        ]
      },
      dataset: 'httpMetrics',
      variable: 'requests',
      aggregation: 'avg',
      groupBy: ['ts'],
      isTopX: false,
      xAxis: 'ts',
      additionalSeries: [],
      userUTC: '0'
    },
    result: [
      ['ts', new Date('2023-01-16T11:01:00')],
      ['2023-01-16T11:01:00Z', 20.333333333333332, 21.666666666666668]
    ]
  },
  withoutGroupBy: {
    params: {
      data: {
        httpMetrics: [
          {
            avg: 20.333333333333332,
            ts: '2023-01-16T11:01:00Z'
          },
          {
            avg: 21.666666666666668,
            ts: '2023-01-16T11:01:00Z'
          }
        ]
      },
      dataset: 'httpMetrics',
      variable: 'requests',
      aggregation: 'avg',
      groupBy: null,
      isTopX: false,
      xAxis: 'ts',
      additionalSeries: ['edgeRequestsTotal'],
      userUTC: '0'
    },
    result: [
      ['ts', new Date('2023-01-16T11:01:00')],
      ['requests', 20.333333333333332, 21.666666666666668],
      ['edgeRequestsTotal', 0, 0]
    ]
  }
}

export default FIXTURES
