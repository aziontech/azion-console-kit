/**
 * Default Sentry plugin for Vue 3
 * @module sentry
 */

import * as Sentry from '@sentry/vue'
import { shouldEnableSentry, getSentryDSN, getSentryConfig } from './config.js'
import { setUserContext } from './methods.js'

/**
 * Default Sentry plugin for Vue 3
 */
export default {
  install(app, options = {}) {
    if (!shouldEnableSentry()) return

    const dsn = getSentryDSN()
    if (!dsn) return

    // Get environment-specific configuration
    const config = getSentryConfig(dsn, {
      app,
      integrations: [
        Sentry.browserTracingIntegration({
          router: options.router
        }),
        Sentry.replayIntegration()
      ]
    })

    // Initialize Sentry with environment-specific configuration
    Sentry.init(config)

    // Expose methods globally
    app.config.globalProperties.$sentry = {
      captureException: Sentry.captureException,
      captureMessage: Sentry.captureMessage,
      setUser: setUserContext,
      setTag: Sentry.setTag,
      setContext: Sentry.setContext
    }
  }
}

// Export utility methods
export * from './methods.js'
export * from './config.js'
