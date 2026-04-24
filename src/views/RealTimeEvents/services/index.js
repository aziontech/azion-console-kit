/**
 * RealTimeEvents service adapters that override timestamp formatting
 * to use compact format with milliseconds.
 */

import * as OriginalServices from '@/services/real-time-events-service'
import { formatTimestampCompact } from '../helpers/format-timestamp'

/**
 * Wrap a service function to replace tsFormat with compact format.
 */
function wrapServiceWithCompactTimestamp(originalService) {
  return async (...args) => {
    const result = await originalService(...args)
    if (result?.data && Array.isArray(result.data)) {
      result.data = result.data.map((item) => ({
        ...item,
        tsFormat: item.ts ? formatTimestampCompact(item.ts) : item.tsFormat
      }))
    }
    return result
  }
}

// Export wrapped versions of all services
export const listHttpRequest = wrapServiceWithCompactTimestamp(OriginalServices.listHttpRequest)
export const listEdgeFunctions = wrapServiceWithCompactTimestamp(OriginalServices.listEdgeFunctions)
export const listEdgeFunctionsConsole = wrapServiceWithCompactTimestamp(
  OriginalServices.listEdgeFunctionsConsole
)
export const listActivityHistory = wrapServiceWithCompactTimestamp(
  OriginalServices.listActivityHistory
)
export const listDataStream = wrapServiceWithCompactTimestamp(OriginalServices.listDataStream)
export const listEdgeDNS = wrapServiceWithCompactTimestamp(OriginalServices.listEdgeDNS)
export const listImageProcessor = wrapServiceWithCompactTimestamp(
  OriginalServices.listImageProcessor
)
export const listTieredCache = wrapServiceWithCompactTimestamp(OriginalServices.listTieredCache)

// Re-export other services that don't need wrapping
export const loadEventsChartAggregation = OriginalServices.loadEventsChartAggregation
export const loadActivityHistory = OriginalServices.loadActivityHistory
export const loadEdgeFunctions = OriginalServices.loadEdgeFunctions
export const loadEdgeFunctionsConsole = OriginalServices.loadEdgeFunctionsConsole
export const loadDataStream = OriginalServices.loadDataStream
export const loadEdgeDNS = OriginalServices.loadEdgeDNS
export const loadImageProcessor = OriginalServices.loadImageProcessor
export const loadTieredCache = OriginalServices.loadTieredCache
