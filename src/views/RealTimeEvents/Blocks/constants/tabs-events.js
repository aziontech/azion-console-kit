import { columnBuilder } from '@/components/list-table/columns/column-builder'

/**
 * Available fields per dataset — these are the fields returned by the GraphQL API
 * and available for dynamic column selection.
 */
const DATASET_FIELDS = {
  httpEvents: [
    'configurationId',
    'host',
    'requestId',
    'httpUserAgent',
    'requestMethod',
    'status',
    'upstreamBytesSent',
    'sslProtocol',
    'wafLearning',
    'requestUri',
    'requestTime',
    'serverProtocol',
    'upstreamCacheStatus',
    'httpReferer',
    'remoteAddress',
    'wafMatch',
    'serverPort',
    'sslCipher',
    'wafEvheaders',
    'serverAddr',
    'scheme'
  ],
  edgeFunctionsEvents: [
    'configurationId',
    'functionLanguage',
    'edgeFunctionsInitiatorTypeList',
    'edgeFunctionsList',
    'edgeFunctionsTime',
    'virtualhostid',
    'edgeFunctionsInstanceIdList'
  ],
  cellsConsoleEvents: [
    'configurationId',
    'functionId',
    'id',
    'lineSource',
    'level',
    'line',
    'solutionId'
  ],
  imagesProcessedEvents: [
    'configurationId',
    'host',
    'requestUri',
    'status',
    'bytesSent',
    'httpUserAgent',
    'httpReferer',
    'referenceError',
    'remoteAddr',
    'remotePort',
    'scheme',
    'solution',
    'sslCipher',
    'sslProtocol',
    'sslSessionReused',
    'upstreamCacheStatus',
    'upstreamResponseTime',
    'upstreamStatus'
  ],
  l2CacheEvents: [
    'configurationId',
    'host',
    'requestUri',
    'status',
    'upstreamCacheStatus',
    'bytesSent',
    'requestLength',
    'requestMethod',
    'upstreamBytesReceived',
    'upstreamResponseTime',
    'upstreamStatus',
    'proxyHost',
    'remoteAddr',
    'remotePort',
    'scheme',
    'serverProtocol',
    'solution',
    'sourceLocPop',
    'upstreamAddr',
    'upstreamBytesSent',
    'upstreamConnectTime',
    'upstreamHeaderTime'
  ],
  idnsQueriesEvents: [
    'level',
    'qtype',
    'resolutionType',
    'sourceLocPop',
    'statusCode',
    'solutionId',
    'uuid',
    'zoneId'
  ],
  dataStreamedEvents: [
    'configurationId',
    'dataStreamed',
    'endpointType',
    'jobName',
    'statusCode',
    'streamedLines',
    'url'
  ],
  activityHistoryEvents: [
    'userIp',
    'authorName',
    'title',
    'resourceType',
    'resourceId',
    'userId',
    'comment',
    'authorEmail',
    'accountId',
    'requestData',
    'userAgent',
    'remotePort',
    'refererHeader'
  ]
}

const TABS_EVENTS = {
  httpRequests: {
    panel: 'httpRequests',
    index: 0,
    title: 'HTTP Requests',
    description: 'Logs of events from requests made to your applications and firewalls.',
    dataset: 'workloadEvents',
    tabRouter: 'http-requests',
    availableFields: DATASET_FIELDS.httpEvents,
    defaultSelectedFields: ['host', 'status', 'requestMethod', 'requestUri'],
    columns: [
      {
        field: 'tsFormat',
        sortField: 'ts',
        header: 'Time'
      },
      {
        field: 'summary',
        header: 'Log Body',
        filterPath: 'summary',
        type: 'component',
        disableSort: true,
        component: (columnData) => columnBuilder({ data: columnData, columnAppearance: 'log-body' })
      }
    ],
    customColumnMapper: (rowData) => ({
      tsFormat: rowData.data,
      summary: rowData.data
    })
  },
  edgeFunctions: {
    panel: 'edgeFunctions',
    index: 1,
    title: 'Functions',
    description: 'Logs of events from requests made to your functions.',
    dataset: 'functionEvents',
    tabRouter: 'edge-functions',
    availableFields: DATASET_FIELDS.edgeFunctionsEvents,
    defaultSelectedFields: ['configurationId', 'functionLanguage'],
    columns: [
      {
        field: 'tsFormat',
        sortField: 'ts',
        header: 'Time'
      },
      {
        field: 'summary',
        header: 'Log Body',
        filterPath: 'summary',
        type: 'component',
        disableSort: true,
        component: (columnData) => columnBuilder({ data: columnData, columnAppearance: 'log-body' })
      }
    ],
    customColumnMapper: (rowData) => ({
      tsFormat: rowData.data,
      summary: rowData.data
    })
  },
  edgeFunctionsConsole: {
    panel: 'edgeFunctionsConsole',
    index: 2,
    title: 'Functions Console',
    description: 'Logs of events from applications using Edge Runtime returned by Cells Console.',
    dataset: 'functionConsoleEvents',
    tabRouter: 'edge-functions-console',
    availableFields: DATASET_FIELDS.cellsConsoleEvents,
    defaultSelectedFields: ['level', 'line'],
    columns: [
      {
        field: 'tsFormat',
        sortField: 'ts',
        header: 'Time'
      },
      {
        field: 'summary',
        header: 'Log Body',
        filterPath: 'summary',
        type: 'component',
        disableSort: true,
        component: (columnData) => columnBuilder({ data: columnData, columnAppearance: 'log-body' })
      }
    ],
    customColumnMapper: (rowData) => ({
      tsFormat: rowData.data,
      summary: rowData.data
    })
  },
  imageProcessor: {
    panel: 'imageProcessor',
    index: 3,
    title: 'Image Processor',
    description:
      'Logs of events from requests made to applications that processed images with Image Processor.',
    dataset: 'imagesProcessedEvents',
    tabRouter: 'image-processor',
    availableFields: DATASET_FIELDS.imagesProcessedEvents,
    defaultSelectedFields: ['host', 'status', 'requestUri'],
    columns: [
      {
        field: 'tsFormat',
        sortField: 'ts',
        header: 'Time'
      },
      {
        field: 'summary',
        header: 'Log Body',
        filterPath: 'summary',
        type: 'component',
        disableSort: true,
        component: (columnData) => columnBuilder({ data: columnData, columnAppearance: 'log-body' })
      }
    ],
    customColumnMapper: (rowData) => ({
      tsFormat: rowData.data,
      summary: rowData.data
    })
  },
  tieredCache: {
    panel: 'tieredCache',
    index: 4,
    title: 'Tiered Cache',
    description: 'Logs of events from requests made to applications using Tiered Cache.',
    dataset: 'l2CacheEvents',
    tabRouter: 'tiered-cache',
    availableFields: DATASET_FIELDS.l2CacheEvents,
    defaultSelectedFields: ['host', 'status', 'upstreamCacheStatus'],
    columns: [
      {
        field: 'tsFormat',
        sortField: 'ts',
        header: 'Time'
      },
      {
        field: 'summary',
        header: 'Log Body',
        filterPath: 'summary',
        type: 'component',
        disableSort: true,
        component: (columnData) => columnBuilder({ data: columnData, columnAppearance: 'log-body' })
      }
    ],
    customColumnMapper: (rowData) => ({
      tsFormat: rowData.data,
      summary: rowData.data
    })
  },
  edgeDNS: {
    panel: 'edgeDNS',
    index: 5,
    title: 'Edge DNS',
    description: 'Logs of events from queries made to Edge DNS.',
    dataset: 'idnsQueriesEvents',
    tabRouter: 'edge-dns',
    availableFields: DATASET_FIELDS.idnsQueriesEvents,
    defaultSelectedFields: ['qtype', 'statusCode'],
    columns: [
      {
        field: 'tsFormat',
        sortField: 'ts',
        header: 'Time'
      },
      {
        field: 'summary',
        header: 'Log Body',
        filterPath: 'summary',
        type: 'component',
        disableSort: true,
        component: (columnData) => columnBuilder({ data: columnData, columnAppearance: 'log-body' })
      }
    ],
    customColumnMapper: (rowData) => ({
      tsFormat: rowData.data,
      summary: rowData.data
    })
  },
  dataStream: {
    panel: 'dataStream',
    index: 6,
    title: 'Data Stream',
    description: 'Logs of data sent to endpoints by Data Stream.',
    dataset: 'dataStreamedEvents',
    tabRouter: 'data-stream',
    availableFields: DATASET_FIELDS.dataStreamedEvents,
    defaultSelectedFields: ['endpointType', 'statusCode'],
    columns: [
      {
        field: 'tsFormat',
        sortField: 'ts',
        header: 'Time'
      },
      {
        field: 'summary',
        header: 'Log Body',
        filterPath: 'summary',
        type: 'component',
        disableSort: true,
        component: (columnData) => columnBuilder({ data: columnData, columnAppearance: 'log-body' })
      }
    ],
    customColumnMapper: (rowData) => ({
      tsFormat: rowData.data,
      summary: rowData.data
    })
  },
  activityHistory: {
    panel: 'activityHistory',
    index: 7,
    title: 'Activity History',
    description:
      'Logs of events from an Azion account regarding activities registered on Activity History. Use the Real-Time Events GraphQL API to query up to 2 years of logs.',
    dataset: 'activityHistoryEvents',
    tabRouter: 'activity-history',
    availableFields: DATASET_FIELDS.activityHistoryEvents,
    defaultSelectedFields: ['title', 'authorName', 'resourceType'],
    columns: [
      {
        field: 'tsFormat',
        sortField: 'ts',
        header: 'Time'
      },
      {
        field: 'summary',
        header: 'Log Body',
        filterPath: 'summary',
        type: 'component',
        disableSort: true,
        component: (columnData) => columnBuilder({ data: columnData, columnAppearance: 'log-body' })
      }
    ],
    customColumnMapper: (rowData) => ({
      tsFormat: rowData.data,
      summary: rowData.data
    })
  }
}

export { DATASET_FIELDS }
export default TABS_EVENTS
