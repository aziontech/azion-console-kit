/**
 * Unified filter-loaders module.
 *
 * Exposes two clean, endpoint-aware entry points that both Real-Time Metrics and
 * Real-Time Events use to populate the shared `AdvancedFilterSystem` component.
 *
 * Internally each entry point imports the correct GraphQL service directly
 * (no loader-by-argument) and reuses the same parsing + shaping pipeline.
 */

import { loadFieldsEventsData } from '@/services/real-time-events-service'
import { loadRealTimeMetricsData } from '@/services/real-time-metrics-services'

import {
  datasetFilterIntrospectionQuery,
  datasetListIntrospectionQuery
} from './introspection-queries'
import { parseDatasetAvailableFilters, parseInfoAvailableFilters } from './parsers'
import { buildFilterFields } from './build-filter-fields'

let eventsAbortController = null
let metricsAbortController = null

// Service-specific call shapes. Each service expects a different `query` payload shape
// (events: raw GraphQL string; metrics: `{ query: <string> }` wrapper that is JSON.stringified).
const callEventsService = (query, signal) => loadFieldsEventsData({ query, signal })
const callMetricsService = (query, signal) => loadRealTimeMetricsData({ query: { query }, signal })

/**
 * Loads and returns the filter fields (UI-ready) for the given Events dataset.
 *
 * @param {string} dataset - Events dataset (e.g. 'workloadEvents').
 * @return {Promise<Array<Object>>} Filter fields list consumed by `AdvancedFilterSystem`.
 */
export const loadEventsFilterFields = async (dataset) => {
  if (eventsAbortController) eventsAbortController.abort()
  eventsAbortController = new AbortController()
  const { signal } = eventsAbortController

  try {
    const [datasetRaw, infoRaw] = await Promise.all([
      callEventsService(datasetFilterIntrospectionQuery(dataset), signal),
      callEventsService(datasetListIntrospectionQuery, signal)
    ])

    return buildFilterFields(
      parseDatasetAvailableFilters(datasetRaw),
      parseInfoAvailableFilters(infoRaw),
      dataset
    )
  } catch (error) {
    if (error?.name === 'AbortError') return []
    return []
  }
}

/**
 * Loads and returns the filter fields (UI-ready) for the given Metrics dataset.
 *
 * @param {string} dataset - Metrics dataset (e.g. 'httpMetrics').
 * @return {Promise<Array<Object>>} Filter fields list consumed by `AdvancedFilterSystem`.
 */
export const loadMetricsFilterFields = async (dataset) => {
  if (metricsAbortController) metricsAbortController.abort()
  metricsAbortController = new AbortController()
  const { signal } = metricsAbortController

  try {
    const [datasetRaw, infoRaw] = await Promise.all([
      callMetricsService(datasetFilterIntrospectionQuery(dataset), signal),
      callMetricsService(datasetListIntrospectionQuery, signal)
    ])

    return buildFilterFields(
      parseDatasetAvailableFilters(datasetRaw),
      parseInfoAvailableFilters(infoRaw),
      dataset
    )
  } catch (error) {
    if (error?.name === 'AbortError') return []
    return []
  }
}

export { buildFilterFields, parseDatasetAvailableFilters, parseInfoAvailableFilters }
