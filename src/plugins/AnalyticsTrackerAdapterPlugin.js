import { getEnvironment } from '@/helpers'
import { makeAnalyticsClient } from './factories/analytics-tracking-factory'
import { AnalyticsTrackerAdapter } from './analytics/AnalyticsTrackerAdapter'
import { segmentHandlerToken } from './factories/segment-handler-token-factory'
/**@type {import('vue').Plugin} */
export default {
  // eslint-disable-next-line no-unused-vars
  install: (Vue, options) => {
    const environment = getEnvironment()

    const segmentToken = segmentHandlerToken(environment)

    const analyticsClient = makeAnalyticsClient(environment)

    const app = Vue
    const trackerInstance = new AnalyticsTrackerAdapter(analyticsClient, segmentToken)
    app.config.globalProperties.$tracker = trackerInstance

    app.provide('tracker', trackerInstance)
  }
}
