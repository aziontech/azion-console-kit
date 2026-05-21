/**
 * @module RealTimeEvents/services
 *
 * Local service adapter layer for the Real-Time Events module.
 *
 * **Purpose:**
 * This file re-exports every list service from the global
 * `@/services/real-time-events-service` module, wrapping each one with
 * `wrapServiceWithCompactTimestamp` so that every row returned to the UI
 * carries a pre-formatted `tsFormat` field in the compact timestamp format
 * (e.g. "2024-06-15 14:30:05.123"). Non-list services (chart aggregation
 * loaders) are re-exported unchanged because they do not return row data.
 *
 * **How `wrapServiceWithCompactTimestamp` works:**
 * 1. Calls the original service function, forwarding all arguments.
 * 2. If the response contains a `data` array, iterates over each row and
 *    sets `row.tsFormat` to the result of `formatTimestampCompact(row.ts, timezone)`.
 *    The row object is mutated in-place to avoid duplicating every row via
 *    object spread.
 * 3. Returns the (possibly mutated) response to the caller.
 *
 * **Timezone resolution:**
 * The account timezone is read from `useAccountStore().accountData.timezone`
 * at *call time* — i.e. each time a wrapped service is invoked — so the
 * formatted timestamps always reflect the user's current timezone setting.
 * If the store is unavailable or the timezone field is missing, it falls
 * back to `'UTC'`. This keeps `formatTimestampCompact` itself pure (it
 * receives timezone as a parameter rather than accessing global state).
 */

import * as OriginalServices from '@/services/real-time-events-service'
import { useAccountStore } from '@stores/account'
import { formatTimestampCompact } from '../helpers/format-timestamp'

/**
 * Resolve the account timezone at call time.
 * @returns {string} IANA timezone string (e.g. "America/Sao_Paulo"), defaults to "UTC".
 */
function getAccountTimezone() {
  try {
    return useAccountStore().accountData?.timezone || 'UTC'
  } catch {
    return 'UTC'
  }
}

/**
 * Wrap a service function so that every row in the response has its `tsFormat`
 * field set to the compact-formatted timestamp for the user's current timezone.
 *
 * The account timezone is resolved lazily (at invocation time) via
 * {@link getAccountTimezone}, keeping the underlying `formatTimestampCompact`
 * helper free of store dependencies.
 *
 * @param {Function} originalService - A list service function from the global
 *   real-time-events-service module (e.g. `listHttpRequest`).
 * @returns {Function} A wrapped async function with the same signature that
 *   adds/overwrites `tsFormat` on each row before returning the response.
 */
function wrapServiceWithCompactTimestamp(originalService) {
  return async (...args) => {
    const result = await originalService(...args)
    if (result?.data && Array.isArray(result.data)) {
      const timezone = getAccountTimezone()
      result.data.forEach((item) => {
        if (item.ts) {
          item.tsFormat = formatTimestampCompact(item.ts, timezone)
        }
      })
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
