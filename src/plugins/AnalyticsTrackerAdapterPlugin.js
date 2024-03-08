import { getEnvironment } from '@/helpers'
import { makeAnalyticsClient } from './factories/analytics-tracking-factory'
import { AnalyticsTrackerAdapter } from './analytics/AnalyticsTrackerAdapter'

/**@type {import('vue').Plugin} */
export default {
  // eslint-disable-next-line no-unused-vars
  install: (Vue, options) => {
    const environment = getEnvironment()

    const analyticsClient = makeAnalyticsClient(environment)

    const app = Vue
    const trackerInstance = new AnalyticsTrackerAdapter(analyticsClient)
    app.config.globalProperties.$tracker = trackerInstance

    app.provide('tracker', trackerInstance)
  }
}
