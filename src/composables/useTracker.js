import { inject } from 'vue'
import { getTracker } from '@/plugins/AnalyticsTrackerAdapterPlugin'

/**
 * Returns the singleton AnalyticsTrackerAdapter for the current app.
 *
 * Inside a Vue component, prefers the instance provided by the plugin via
 * `inject('tracker')`; falls back to the module-level singleton when called
 * outside a component context (services, guards, tests).
 *
 * @returns {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter}
 */
export const useTracker = () => inject('tracker', null) ?? getTracker()
