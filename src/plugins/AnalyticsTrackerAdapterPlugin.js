import { makeAnalyticsClient } from './factories/analytics-tracking-factory'
import { AnalyticsTrackerAdapter } from './analytics/AnalyticsTrackerAdapter'

let trackerInstance = null

const logPluginError = (event, err) => {
  // eslint-disable-next-line no-console
  console.warn(
    JSON.stringify({
      level: 'warn',
      tag: 'analytics-plugin',
      event,
      msg: err?.message,
      ts: Date.now()
    })
  )
}

/**
 * Returns the singleton AnalyticsTrackerAdapter. Lazy-initialized so the same
 * instance is shared between Vue's `inject('tracker')` and direct imports
 * from non-component code (route guards, services, helpers).
 *
 * If construction fails for any reason (factory crash, missing env), returns
 * a no-op adapter so callers can keep using `.foo.bar(...).track()` without
 * blowing up the user flow.
 *
 * @returns {import('./analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter}
 */
export const getTracker = () => {
  if (trackerInstance) return trackerInstance
  try {
    trackerInstance = new AnalyticsTrackerAdapter(makeAnalyticsClient())
  } catch (err) {
    logPluginError('tracker_init_failed', err)
    // Fall back to a disabled adapter (null client → all ops become no-ops).
    trackerInstance = new AnalyticsTrackerAdapter(null)
  }
  return trackerInstance
}

/**@type {import('vue').Plugin} */
export default {
  install: (app) => {
    // getTracker() falls back to a no-op adapter on init failure, but we
    // still wrap the install path so an unexpected failure here can never
    // abort the Vue boot — analytics must never block the app from loading.
    try {
      const tracker = getTracker()
      app.config.globalProperties.$tracker = tracker
      app.provide('tracker', tracker)
    } catch (err) {
      logPluginError('plugin_install_failed', err)
    }
  }
}
