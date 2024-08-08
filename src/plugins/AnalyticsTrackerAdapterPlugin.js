import { makeAnalyticsClient } from './factories/analytics-tracking-factory'
import { AnalyticsTrackerAdapter } from './analytics/AnalyticsTrackerAdapter'
import { makeSegmentToken } from './factories/segment-handler-token-factory'
/**@type {import('vue').Plugin} */
export default {
  // eslint-disable-next-line no-unused-vars
  install: (Vue, options) => {
    const segmentToken = makeSegmentToken()

    let analyticsClient = undefined

    if (segmentToken) {
      analyticsClient = makeAnalyticsClient(segmentToken)
    }

    const app = Vue
    const trackerInstance = new AnalyticsTrackerAdapter(analyticsClient, segmentToken)
    app.config.globalProperties.$tracker = trackerInstance

    app.provide('tracker', trackerInstance)
  }
}
