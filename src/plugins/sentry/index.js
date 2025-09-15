/**
 * Default Sentry plugin for Vue 3
 * @module sentry
 */

import * as Sentry from '@sentry/vue'
import { getSentryConfig } from './config.js'

export default {
  install(app, options = {}) {
    const { router = null } = options

    const config = getSentryConfig({
      app,
      sendDefaultPii: true,
      enableLogs: true,
      integrations: [
        ...(router ? [Sentry.browserTracingIntegration({ router })] : []),
        // Session replay
        Sentry.replayIntegration()
      ]
    })

    Sentry.init(config)

    app.config.globalProperties.$sentry = {
      captureException: Sentry.captureException,
      captureMessage: Sentry.captureMessage,
      setUser: Sentry.setUser,
      setTag: Sentry.setTag,
      setContext: Sentry.setContext
    }
  }
}
