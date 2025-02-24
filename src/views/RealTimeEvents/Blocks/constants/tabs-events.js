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
        field: 'summary',
        header: 'Log Body',
        filterPath: 'summary',
        type: 'component',
        component: (columnData) => columnBuilder({ data: columnData, columnAppearance: 'log-body' })
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
        field: 'summary',
        header: 'Log Body',
        filterPath: 'summary',
        type: 'component',
        component: (columnData) => columnBuilder({ data: columnData, columnAppearance: 'log-body' })
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
        field: 'summary',
        header: 'Log Body',
        filterPath: 'summary',
        type: 'component',
        component: (columnData) => columnBuilder({ data: columnData, columnAppearance: 'log-body' })
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
        field: 'summary',
        header: 'Log Body',
        filterPath: 'summary',
        type: 'component',
        component: (columnData) => columnBuilder({ data: columnData, columnAppearance: 'log-body' })
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
        field: 'summary',
        header: 'Log Body',
        filterPath: 'summary',
        type: 'component',
        component: (columnData) => columnBuilder({ data: columnData, columnAppearance: 'log-body' })
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
        field: 'summary',
        header: 'Log Body',
        filterPath: 'summary',
        type: 'component',
        component: (columnData) => columnBuilder({ data: columnData, columnAppearance: 'log-body' })
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
        field: 'summary',
        header: 'Log Body',
        filterPath: 'summary',
        type: 'component',
        component: (columnData) => columnBuilder({ data: columnData, columnAppearance: 'log-body' })
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
        field: 'summary',
        header: 'Log Body',
        filterPath: 'summary',
        type: 'component',
        component: (columnData) => columnBuilder({ data: columnData, columnAppearance: 'log-body' })
      }
    ],
    customColumnMapper: (rowData) => ({
      title: rowData.data.value
    })
  }
}

export default TABS_EVENTS
