const FIXTURES = {
  datasets: [
    {
      name: 'ingestMetrics',
      description: 'Query Ingest Aggregated By Minute, Hour and Day with aggregate options.',
      type: {
        ofType: {
          fields: [
            {
              name: 'ts',
              type: {
                name: 'CustomDateTime'
              }
            },
            {
              name: 'sourceLocPop',
              type: {
                name: 'String'
              }
            },
            {
              name: 'sum',
              type: {
                name: 'String'
              }
            },
            {
              name: 'count',
              type: {
                name: 'String'
              }
            },
            {
              name: 'avg',
              type: {
                name: 'String'
              }
            },
            {
              name: 'max',
              type: {
                name: 'String'
              }
            },
            {
              name: 'min',
              type: {
                name: 'String'
              }
            },
            {
              name: 'client_id',
              type: {
                name: 'String'
              }
            }
          ]
        }
      }
    },
    {
      name: 'httpMetrics',
      description: 'Query Http Aggregated By Minute, Hour and Day with aggregate options.',
      type: {
        ofType: {
          fields: [
            {
              name: 'ts',
              type: {
                name: 'CustomDateTime'
              }
            },
            {
              name: 'configurationId',
              type: {
                name: 'String'
              }
            },
            {
              name: 'sum',
              type: {
                name: 'String'
              }
            }
          ]
        }
      }
    }
  ],
  transformedDatasets: {
    httpMetrics: {
      configurationId: { name: 'configurationId', type: 'String' },
      ts: { name: 'ts', type: 'CustomDateTime' }
    },
    ingestMetrics: {
      sourceLocPop: { name: 'sourceLocPop', type: 'String' },
      ts: { name: 'ts', type: 'CustomDateTime' }
    }
  }
}

export default FIXTURES
