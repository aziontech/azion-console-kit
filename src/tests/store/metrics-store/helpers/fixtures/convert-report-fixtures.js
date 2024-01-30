const FIXTURES = {
  groupByReport: {
    groupBy: ['ts'],
    expected: ['ts']
  },
  xAxisReport: {
    xAxis: 'ts',
    groupBy: ['sum'],
    expected: ['ts', 'sum']
  },
  isTopXReport: {
    isTopX: true,
    groupBy: ['sum'],
    xAxis: 'ts',
    expected: ['sum']
  },
  xAxisSumReport: {
    xAxis: 'sum',
    expected: 'sum'
  },
  orderReport: {
    xAxis: 'ts',
    orderDirection: 'ASC',
    expected: 'ts_ASC'
  },
  orderByAggregationReport: {
    isTopX: true,
    aggregations: [{ aggregation: 'sum' }],
    orderDirection: 'ASC',
    expected: 'sum_ASC'
  },
  orderByFieldReport: {
    isTopX: true,
    aggregations: [],
    fields: ['sum', 'count'],
    orderDirection: 'ASC',
    expected: 'sum'
  },
  variablesFilterReport: {
    filters: {
      and: {
        hostNe: {
          value: 'host',
          meta: {
            inputType: 'String'
          }
        },
        meta: {
          fieldPrefix: 'and_'
        }
      },
      tsRange: {
        begin: '2023-01-16T11:00:44',
        end: '2023-03-16T11:00:44'
      }
    },
    expectedFilters: {
      and: {
        hostNe: '$and_hostNe'
      },
      tsRange: {
        begin: '$tsRange_begin',
        end: '$tsRange_end'
      }
    },
    expectedVariables: {
      and_hostNe: 'host',
      tsRange_begin: '2023-01-16T11:00:44',
      tsRange_end: '2023-03-16T11:00:44'
    },
    expectedFilterDetails: [
      {
        name: '$tsRange_begin',
        type: 'DateTime!',
        value: '2023-01-16T11:00:44'
      },
      {
        name: '$tsRange_end',
        type: 'DateTime!',
        value: '2023-03-16T11:00:44'
      },
      {
        name: '$and_hostNe',
        type: 'String',
        value: 'host'
      }
    ]
  },
  allParamsSetted: {
    params: {
      filters: {
        tsRange: {
          begin: '2023-01-16T11:00:44',
          end: '2023-03-16T11:00:44'
        },
        statusRange: {
          begin: 200,
          end: 299
        }
      },
      groupBy: ['status'],
      limit: 1000,
      fields: ['edgeRequestsTotal'],
      xAxis: 'ts',
      isTopX: false,
      rotated: false,
      dataset: 'httpMetrics',
      orderDirection: 'ASC'
    },
    queryResult:
      'query ($tsRange_begin:DateTime!, $tsRange_end:DateTime!) {\n' +
      '      httpMetrics (\n' +
      '        limit: 1000\n' +
      '        resample: {\n' +
      '          function: mean\n' +
      '          points: 200\n' +
      '        }\n' +
      '        \n' +
      '        groupBy: [ts, status]\n' +
      '        orderBy: [ts_ASC]\n' +
      '        filter: {\n' +
      '          tsRange: {\n' +
      'begin: $tsRange_begin\n' +
      'end: $tsRange_end\n' +
      '\n' +
      '}\n' +
      '\n' +
      '        }\n' +
      '        ) {\n' +
      '          edgeRequestsTotal\n' +
      'ts\n' +
      'status\n' +
      '        }\n' +
      '      }',
    variablesResult: {
      tsRange_begin: '2023-01-16T11:00:44',
      tsRange_end: '2023-03-16T11:00:44',
      statusRange_begin: 200,
      statusRange_end: 299
    }
  },
  withAggregation: {
    params: {
      filters: {
        tsRange: {
          begin: '2023-01-16T11:00:44',
          end: '2023-03-16T11:00:44'
        },
        statusRange: {
          begin: 200,
          end: 299
        }
      },
      groupBy: ['status'],
      limit: 1000,
      fields: ['edgeRequestsTotal'],
      xAxis: 'ts',
      isTopX: false,
      rotated: false,
      dataset: 'httpMetrics',
      orderDirection: 'ASC',
      aggregations: [
        {
          aggregation: 'sum',
          variable: 'dataStreamed'
        }
      ]
    },
    queryResult:
      'query ($tsRange_begin:DateTime!, $tsRange_end:DateTime!) {\n' +
      '      httpMetrics (\n' +
      '        limit: 1000\n' +
      '        resample: {\n' +
      '          function: mean\n' +
      '          points: 200\n' +
      '        }\n' +
      '        aggregate: {sum: dataStreamed \n' +
      '}\n' +
      '        groupBy: [ts, status]\n' +
      '        orderBy: [ts_ASC]\n' +
      '        filter: {\n' +
      '          tsRange: {\n' +
      'begin: $tsRange_begin\n' +
      'end: $tsRange_end\n' +
      '\n' +
      '}\n' +
      '\n' +
      '        }\n' +
      '        ) {\n' +
      '          edgeRequestsTotal\n' +
      'sum\n' +
      'ts\n' +
      'status\n' +
      '        }\n' +
      '      }',
    variablesResult: {
      tsRange_begin: '2023-01-16T11:00:44',
      tsRange_end: '2023-03-16T11:00:44',
      statusRange_begin: 200,
      statusRange_end: 299
    }
  },
  withoutFilters: {
    params: {
      groupBy: ['status'],
      limit: 1000,
      fields: ['edgeRequestsTotal'],
      xAxis: 'ts',
      isTopX: false,
      rotated: false,
      dataset: 'httpMetrics',
      orderDirection: 'ASC',
      aggregations: [
        {
          aggregation: 'sum',
          variable: 'dataStreamed'
        }
      ]
    },
    queryResult:
      'query () {\n' +
      '      httpMetrics (\n' +
      '        limit: 1000\n' +
      '        resample: {\n' +
      '          function: mean\n' +
      '          points: 200\n' +
      '        }\n' +
      '        aggregate: {sum: dataStreamed \n' +
      '}\n' +
      '        groupBy: [ts, status]\n' +
      '        orderBy: [ts_ASC]\n' +
      '        filter: {\n' +
      '          \n' +
      '        }\n' +
      '        ) {\n' +
      '          edgeRequestsTotal\n' +
      'sum\n' +
      'ts\n' +
      'status\n' +
      '        }\n' +
      '      }'
  }
}

export default FIXTURES
