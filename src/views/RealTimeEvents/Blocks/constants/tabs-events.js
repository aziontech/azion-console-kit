import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'

const TABS_EVENTS = {
  httpRequests: {
    panel: 'httpRequests',
    index: 0,
    title: 'HTTP Requests',
    description: 'Logs of events from requests made to your edge applications and edge firewalls.',
    dataset: 'httpEvents',
    tabRouter: 'http-requests',
    columns: [
      {
        field: 'tsFormat',
        sortField: 'ts',
        header: 'TS'
      },
      {
        field: 'configurationId',
        header: 'Configuration ID'
      },
      {
        field: 'host',
        header: 'Host'
      },
      {
        field: 'requestMethod',
        header: 'Request Method'
      },
      {
        field: 'status',
        header: 'Status'
      },
      {
        field: 'requestUri',
        header: 'Request Uri'
      }
    ],
    customColumnMapper: (rowData) => ({
      tsFormat: rowData.data
    })
  },
  edgeFunctions: {
    panel: 'edgeFunctions',
    index: 1,
    title: 'Edge Functions',
    description: 'Logs of events from requests made to your edge functions.',
    dataset: 'edgeFunctionsEvents',
    tabRouter: 'edge-functions',
    columns: [
      {
        field: 'tsFormat',
        sortField: 'ts',
        header: 'TS'
      },
      {
        field: 'configurationId',
        header: 'Configuration ID'
      },
      {
        field: 'functionLanguage',
        header: 'Function Language'
      },
      {
        field: 'edgeFunctionsInitiatorTypeList',
        header: 'Edge Functions Initiator Type List'
      },
      {
        field: 'edgeFunctionsList',
        header: 'Edge Functions List',
        filterPath: 'edgeFunctionsList',
        type: 'component',
        component: (columnData) =>
          columnBuilder({ data: columnData, columnAppearance: 'expand-column' })
      },
      {
        field: 'edgeFunctionsTime',
        header: 'Edge Functions Time'
      }
    ],
    customColumnMapper: (rowData) => ({
      edgeFunctionsList: rowData.data.value
    })
  },
  edgeFunctionsConsole: {
    panel: 'edgeFunctionsConsole',
    index: 2,
    title: 'Edge Functions Console',
    description:
      'Logs of events from edge applications using Edge Runtime returned by Cells Console.',
    dataset: 'cellsConsoleEvents',
    tabRouter: 'edge-functions-console',
    columns: [
      {
        field: 'tsFormat',
        sortField: 'ts',
        header: 'TS'
      },
      {
        field: 'configurationId',
        header: 'Configuration ID'
      },
      {
        field: 'functionId',
        header: 'Function Id'
      },
      {
        field: 'lineSource',
        header: 'Line Source',
        filterPath: 'lineSource.content',
        type: 'component',
        component: (columnData) =>
          columnBuilder({
            data: columnData,
            columnAppearance: 'tag'
          })
      },
      {
        field: 'level',
        header: 'Level',
        type: 'component',
        filterPath: 'level.content',
        component: (columnData) =>
          columnBuilder({
            data: columnData,
            columnAppearance: 'tag'
          })
      },
      {
        field: 'line',
        header: 'Line',
        type: 'component',
        filterPath: 'line',
        component: (columnData) =>
          columnBuilder({ data: columnData, columnAppearance: 'expand-text-column' })
      }
    ],
    customColumnMapper: (rowData) => ({
      lineSource: rowData.data.content,
      level: rowData.data.content,
      line: rowData.data.value
    })
  },
  imageProcessor: {
    panel: 'imageProcessor',
    index: 3,
    title: 'Image Processor',
    description:
      'Logs of events from requests made to edge applications that processed images with Image Processor.',
    dataset: 'imagesProcessedEvents',
    tabRouter: 'image-processor',
    columns: [
      {
        field: 'tsFormat',
        sortField: 'ts',
        header: 'TS'
      },
      {
        field: 'configurationId',
        header: 'Configuration ID'
      },
      {
        field: 'host',
        header: 'Host'
      },
      {
        field: 'status',
        header: 'Status'
      },
      {
        field: 'bytesSent',
        header: 'Bytes Sent'
      },
      {
        field: 'requestUri',
        header: 'Request Uri',
        type: 'component',
        filterPath: 'requestUri',
        component: (columnData) =>
          columnBuilder({ data: columnData, columnAppearance: 'expand-text-column' })
      }
    ],
    customColumnMapper: (rowData) => ({
      requestUri: rowData.data.value
    })
  },
  tieredCache: {
    panel: 'tieredCache',
    index: 4,
    title: 'Tiered Cache',
    description: 'Logs of events from requests made to edge applications using Tiered Cache.',
    dataset: 'l2CacheEvents',
    tabRouter: 'tiered-cache',
    columns: [
      {
        field: 'tsFormat',
        sortField: 'ts',
        header: 'TS'
      },
      {
        field: 'configurationId',
        header: 'Configuration ID'
      },
      {
        field: 'host',
        header: 'Host'
      },
      {
        field: 'requestMethod',
        header: 'Request Method'
      },
      {
        field: 'upstreamCacheStatus',
        header: 'Upstream Cache Status',
        type: 'component',
        filterPath: 'upstreamCacheStatus.content',
        component: (columnData) =>
          columnBuilder({
            data: columnData,
            columnAppearance: 'tag'
          })
      },
      {
        field: 'requestUri',
        header: 'Request Uri'
      }
    ],
    customColumnMapper: (rowData) => ({
      upstreamCacheStatus: rowData.data.content
    })
  },
  edgeDNS: {
    panel: 'edgeDNS',
    index: 5,
    title: 'Edge DNS',
    description: 'Logs of events from queries made to Edge DNS.',
    dataset: 'idnsQueriesEvents',
    tabRouter: 'edge-dns',
    columns: [
      {
        field: 'tsFormat',
        sortField: 'ts',
        header: 'TS'
      },
      {
        field: 'level',
        header: 'Level',
        type: 'component',
        filterPath: 'level.content',
        component: (columnData) =>
          columnBuilder({
            data: columnData,
            columnAppearance: 'tag'
          })
      },
      {
        field: 'zoneId',
        header: 'Zone ID'
      },
      {
        field: 'qtype',
        header: 'Q Type'
      },
      {
        field: 'resolutionType',
        header: 'Resolution Type'
      },
      {
        field: 'solutionId',
        header: 'Solution ID'
      }
    ],
    customColumnMapper: (rowData) => ({
      level: rowData.data.content
    })
  },
  dataStream: {
    panel: 'dataStream',
    index: 6,
    title: 'Data Stream',
    description: 'Logs of data sent to endpoints by Data Stream.',
    dataset: 'dataStreamedEvents',
    tabRouter: 'data-stream',
    columns: [
      {
        field: 'tsFormat',
        sortField: 'ts',
        header: 'TS'
      },
      {
        field: 'configurationId',
        header: 'Configuration ID'
      },
      {
        field: 'jobName',
        header: 'Job Name',
        type: 'component',
        filterPath: 'jobName.content',
        component: (columnData) =>
          columnBuilder({
            data: columnData,
            columnAppearance: 'tag'
          })
      },
      {
        field: 'endpointType',
        header: 'Endpoint Type',
        type: 'component',
        filterPath: 'endpointType.content',
        component: (columnData) =>
          columnBuilder({
            data: columnData,
            columnAppearance: 'tag'
          })
      },
      {
        field: 'url',
        header: 'URL'
      },
      {
        field: 'statusCode',
        header: 'Status Code'
      }
    ],
    customColumnMapper: (rowData) => ({
      jobName: rowData.data.content,
      endpointType: rowData.data.content
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
    columns: [
      {
        field: 'tsFormat',
        sortField: 'ts',
        header: 'TS'
      },
      {
        field: 'userIp',
        header: 'User IP'
      },
      {
        field: 'authorName',
        header: 'Author Name'
      },
      {
        field: 'title',
        header: 'Title',
        type: 'component',
        filterPath: 'title',
        component: (columnData) =>
          columnBuilder({ data: columnData, columnAppearance: 'expand-text-column' })
      },
      {
        field: 'resourceType',
        header: 'Resource Type'
      },
      {
        field: 'resourceId',
        header: 'Resource ID'
      }
    ],
    customColumnMapper: (rowData) => ({
      title: rowData.data.value
    })
  }
}

export default TABS_EVENTS
