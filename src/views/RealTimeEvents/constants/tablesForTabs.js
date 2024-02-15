const LIMIT_ROWS = 200

const TABLES_FOR_TABS = [
  {
    index: 0,
    label: 'HTTP Requests',
    tabName: 'http-requests',
    description: 'Description table example 0',
    table: {
      dataset: 'httpEvents',
      limit: LIMIT_ROWS,
      fields: [
        'bytesSent',
        'configurationId',
        'debugLog',
        'geolocAsn',
        'geolocCountryName',
        'geolocRegionName',
        'host',
        'ts'
      ],
      orderBy: 'ts_ASC'
    },
    row: {
      dataset: 'httpEvents',
      limit: LIMIT_ROWS,
      fields: [
        'bytesSent',
        'configurationId',
        'debugLog',
        'geolocAsn',
        'geolocCountryName',
        'geolocRegionName',
        'host',
        'ts'
      ]
    }
  },
  {
    index: 1,
    label: 'Edge Functions',
    tabName: 'edge-functions',
    description: 'Description table example 1',
    table: {
      dataset: 'edgeFunctionsEvents',
      limit: LIMIT_ROWS,
      fields: [
        'configurationId',
        'edgeFunctionsInstanceIdList',
        'edgeFunctionsInitiatorTypeList',
        'edgeFunctionsList',
        'edgeFunctionsSolutionId',
        'edgeFunctionsTime',
        'functionLanguage',
        'ts', 
      ],
      orderBy: 'ts_ASC'
    },
    row: {
      dataset: 'httpEvents',
      limit: LIMIT_ROWS,
      fields: [
        'bytesSent',
        'configurationId',
        'debugLog',
        'geolocAsn',
        'geolocCountryName',
        'geolocRegionName',
        'host',
        'ts'
      ]
    }
  },
  {
    index: 2,
    label: 'Edge Functions Console',
    tabName: 'edge-functions-console',
    description: 'Description table example 2',
    table: {
      dataset: 'cellsConsoleEvents',
      limit: LIMIT_ROWS,
      fields: [
        'configurationId',
        'functionId',
        'id',
        'level',
        'line',
        'lineSource',
        'solutionId',
        'ts'
      ],
      orderBy: 'ts_ASC'
    },
    row: {
      dataset: 'httpEvents',
      limit: LIMIT_ROWS,
      fields: [
        'bytesSent',
        'configurationId',
        'debugLog',
        'geolocAsn',
        'geolocCountryName',
        'geolocRegionName',
        'host',
        'ts'
      ]
    }
  },
  {
    index: 3,
    label: 'Image Processor',
    tabName: 'image-processor',
    description: 'Description table example 3',
    table: {
      dataset: 'imagesProcessedEvents',
      limit: LIMIT_ROWS,
      fields: [
        'bytesSent',
        'configurationId',
        'host',
        'httpReferer',
        'httpUserAgent',
        'referenceError',
        'ts'
      ],
      orderBy: 'ts_ASC'
    },
    row: {
      dataset: 'httpEvents',
      limit: LIMIT_ROWS,
      fields: [
        'bytesSent',
        'configurationId',
        'debugLog',
        'geolocAsn',
        'geolocCountryName',
        'geolocRegionName',
        'host',
        'ts'
      ]
    }
  },
  {
    index: 4,
    label: 'L2 Cache',
    tabName: 'l2-cache',
    description: 'Description table example 4',
    table: {
      dataset: 'l2CacheEvents',
      limit: LIMIT_ROWS,
      fields: [
        'bytesSent',
        'cacheKey',
        'cacheTtl',
        '',
        'configurationId',
        'host',
        'proxyHost',
        'ts'
      ],
      orderBy: 'ts_ASC'
    },
    row: {
      dataset: 'httpEvents',
      limit: LIMIT_ROWS,
      fields: [
        'bytesSent',
        'configurationId',
        'debugLog',
        'geolocAsn',
        'geolocCountryName',
        'geolocRegionName',
        'host',
        'ts'
      ]
    }
  },
  {
    index: 5,
    label: 'Intelligent DNS',
    tabName: 'intelligent-dns',
    description: 'Description table example 5',
    table: {
      dataset: 'idnsQueriesEvents',
      limit: LIMIT_ROWS,
      fields: [
        'level',
        'qtype',
        'resolutionType',
        'statusCode',
        'solutionId',
        'ts',
        'uuid',
        'zoneID'
      ],
      orderBy: 'ts_ASC'
    },
    row: {
      dataset: 'httpEvents',
      limit: LIMIT_ROWS,
      fields: [
        'bytesSent',
        'configurationId',
        'debugLog',
        'geolocAsn',
        'geolocCountryName',
        'geolocRegionName',
        'host',
        'ts'
      ]
    }
  },
  {
    index: 6,
    label: 'Data Streaming',
    tabName: 'data-streaming',
    description: 'Description table example 6',
    table: {
      dataset: 'dataStreamedEvents',
      limit: LIMIT_ROWS,
      fields: [
        'configurationId',
        'dataStreamed',
        'endpointType',
        'jobName',
        'statusCode',
        'streamedLines',
        'ts',
        'url'
      ],
      orderBy: 'ts_ASC'
    },
    row: {
      dataset: 'httpEvents',
      limit: LIMIT_ROWS,
      fields: [
        'bytesSent',
        'configurationId',
        'debugLog',
        'geolocAsn',
        'geolocCountryName',
        'geolocRegionName',
        'host',
        'ts'
      ]
    }
  },
  {
    index: 7,
    label: 'Activity History',
    tabName: 'activity-history',
    description: 'Description table example 7',
    table: {
      dataset: 'activityHistoryEvents',
      limit: LIMIT_ROWS,
      fields: ['accountId', 'authorEmail', 'authorName', 'comment', 'title', 'ts'],
      orderBy: 'ts_ASC'
    },
    row: {
      dataset: 'httpEvents',
      limit: LIMIT_ROWS,
      fields: [
        'bytesSent',
        'configurationId',
        'debugLog',
        'geolocAsn',
        'geolocCountryName',
        'geolocRegionName',
        'host',
        'ts'
      ]
    }
  }
]

export default TABLES_FOR_TABS
