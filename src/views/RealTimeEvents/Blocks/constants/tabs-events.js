/**
 * Real-Time Events tabs — dataset identifiers are the GraphQL dataset names
 * documented at:
 *   Events:  https://www.azion.com/en/documentation/devtools/graphql-api/features/gql-real-time-events-fields/
 *   Metrics: https://www.azion.com/en/documentation/devtools/graphql-api/features/gql-real-time-metrics-fields/
 *
 * Field lists (`availableFields`) are sourced from the single source of truth
 * `_shared/dataset-fields.js` (same docs). The chart/stack-by configuration
 * and presentation metadata stay local to this file.
 */

import { CURATED_DATASET_FIELDS } from '@/services/real-time-events-service/_shared/dataset-fields'

const DATASET_FIELDS = CURATED_DATASET_FIELDS

/**
 * Shared column mapper used by all datasets for CSV export.
 * Maps row data to { tsFormat, summary } for the export function.
 *
 * @param {{ data: any }} rowData – row data provided by the DataTable export callback
 * @returns {{ tsFormat: any, summary: any }}
 */
export const defaultColumnMapper = (rowData) => ({
  tsFormat: rowData.data,
  summary: rowData.data
})

const TABS_EVENTS = {
  httpRequests: {
    panel: 'httpRequests',
    title: 'HTTP Requests',
    description: 'Logs of events from requests made to your applications and firewalls.',
    dataset: 'workloadEvents',
    tabRouter: 'http-requests',
    availableFields: DATASET_FIELDS.workloadEvents,
    defaultSelectedFields: ['host', 'status', 'requestMethod', 'requestUri'],
    // Chart options
    showStackBy: true,
    showSummary: true,
    stackByOptions: [
      { label: 'Default', value: 'none' },
      { label: 'Status', value: 'status' },
      { label: 'Request Method', value: 'requestMethod' },
      { label: 'Cache Status', value: 'upstreamCacheStatus' }
    ]
  },
  edgeFunctions: {
    panel: 'edgeFunctions',
    title: 'Functions',
    description: 'Logs of events from requests made to your functions.',
    dataset: 'functionEvents',
    tabRouter: 'edge-functions',
    availableFields: DATASET_FIELDS.functionEvents,
    defaultSelectedFields: ['configurationId', 'functionLanguage'],
    // Chart options - volume over time, no stack-by or summary
    showStackBy: false,
    showSummary: false
  },
  edgeFunctionsConsole: {
    panel: 'edgeFunctionsConsole',
    title: 'Functions Console',
    description: 'Logs of events from applications using Edge Runtime returned by Cells Console.',
    dataset: 'functionConsoleEvents',
    tabRouter: 'edge-functions-console',
    availableFields: DATASET_FIELDS.functionConsoleEvents,
    defaultSelectedFields: ['level', 'line'],
    // Chart options - volume over time, no stack-by or summary
    showStackBy: false,
    showSummary: false
  },
  imageProcessor: {
    panel: 'imageProcessor',
    title: 'Image Processor',
    description:
      'Logs of events from requests made to applications that processed images with Image Processor.',
    dataset: 'imagesProcessedEvents',
    tabRouter: 'image-processor',
    availableFields: DATASET_FIELDS.imagesProcessedEvents,
    defaultSelectedFields: ['host', 'status', 'requestUri'],
    // Chart options - volume over time, no stack-by or summary
    showStackBy: false,
    showSummary: false
  },
  tieredCache: {
    panel: 'tieredCache',
    title: 'Tiered Cache',
    description: 'Logs of events from requests made to applications using Tiered Cache.',
    dataset: 'tieredCacheEvents',
    tabRouter: 'tiered-cache',
    availableFields: DATASET_FIELDS.tieredCacheEvents,
    defaultSelectedFields: ['host', 'status', 'upstreamCacheStatus'],
    // Chart options
    showStackBy: true,
    showSummary: false,
    stackByOptions: [
      { label: 'Default', value: 'none' },
      { label: 'Cache Status', value: 'upstreamCacheStatus' }
    ]
  },
  edgeDNS: {
    panel: 'edgeDNS',
    title: 'Edge DNS',
    description: 'Logs of events from queries made to Edge DNS.',
    dataset: 'edgeDnsQueriesEvents',
    tabRouter: 'edge-dns',
    availableFields: DATASET_FIELDS.edgeDnsQueriesEvents,
    defaultSelectedFields: ['qtype', 'statusCode'],
    // Chart options - volume over time, no stack-by or summary
    showStackBy: false,
    showSummary: false
  },
  dataStream: {
    panel: 'dataStream',
    title: 'Data Stream',
    description: 'Logs of data sent to endpoints by Data Stream.',
    dataset: 'dataStreamedEvents',
    tabRouter: 'data-stream',
    availableFields: DATASET_FIELDS.dataStreamedEvents,
    defaultSelectedFields: ['endpointType', 'statusCode'],
    // Chart options - volume over time, no stack-by or summary
    showStackBy: false,
    showSummary: false
  },
  activityHistory: {
    panel: 'activityHistory',
    title: 'Activity History',
    description:
      'Logs of events from an Azion account regarding activities registered on Activity History. Use the Real-Time Events GraphQL API to query up to 2 years of logs.',
    dataset: 'activityHistoryEvents',
    tabRouter: 'activity-history',
    availableFields: DATASET_FIELDS.activityHistoryEvents,
    defaultSelectedFields: ['title', 'authorName', 'resourceType'],
    // Chart options - volume over time, no stack-by or summary
    showStackBy: false,
    showSummary: false
  }
}

export default TABS_EVENTS
