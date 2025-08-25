/**
 * Main Sentry plugin for Vue 3
 * @module sentry
 */

import * as Sentry from '@sentry/vue'
import { browserTracingIntegration, replayIntegration } from '@sentry/vue'
import {
  shouldEnableSentry,
  getSentryConfig,
  getEnvironmentConfig,
  domainConfig
} from './config.js'
import { createBeforeSendFilter, createBeforeBreadcrumbFilter } from './filters.js'
import { setUserContext } from './methods.js'
import { initializeAutoMonitoring } from './auto-monitoring.js'
import { sentryMixin } from './vue-mixin.js'
import {
  setupHttpInterceptors,
  setupHttpClientInterceptors,
  setupAbortManagerInterceptors
} from './http-interceptor.js'

/**
 * Sentry plugin for Vue 3
 * Configured for JavaScript error monitoring and performance tracking
 */
export default {
  /**
   * Installs the Sentry plugin
   * @param {Object} app - Vue application instance
   * @param {Object} options - Configuration options
   * @param {Object} options.router - Vue Router instance
   * @param {Object} options.httpService - HttpService instance
   * @param {Object} options.httpClient - HttpClient instance
   * @param {Object} options.abortManager - AbortManager instance
   * @param {string} options.dsn - Sentry DSN
   */
  install(app, options = {}) {
    const environment = import.meta.env.VITE_ENVIRONMENT || 'development'

    // Check if Sentry should be enabled
    if (!shouldEnableSentry(environment)) return

    const dsn = options.dsn || import.meta.env.VITE_SENTRY_DSN

    if (!dsn) return

    const envConfig = getEnvironmentConfig(environment)

    // Configure integrations based on environment settings
    const integrations = []

    // Add BrowserTracing for performance monitoring
    if (envConfig.enablePerformance) {
      integrations.push(
        browserTracingIntegration({
          router: options.router
        })
      )
    }

    // Add Session Replay for session recording
    if (envConfig.enableSessionReplay) {
      integrations.push(
        replayIntegration()
      )
    }

    // Get base Sentry configuration
    const sentryConfig = getSentryConfig(environment, dsn, {
      app,
      integrations,
      beforeBreadcrumb: createBeforeBreadcrumbFilter(),
      beforeSend: createBeforeSendFilter(environment)
    })

    // Initialize Sentry
    Sentry.init(sentryConfig)

    // Configure user context when available
    const setUserContextWrapper = (user) => {
      setUserContext(user)
    }

    // Expose useful methods globally
    app.config.globalProperties.$sentry = {
      captureException: Sentry.captureException,
      captureMessage: Sentry.captureMessage,
      setUser: setUserContextWrapper,
      setTag: Sentry.setTag,
      setContext: Sentry.setContext
    }

    // Register mixin globally
    app.mixin(sentryMixin)

    // Initialize automatic monitoring
    if (environment === 'stage' || environment === 'production') {
      initializeAutoMonitoring(options.router, environment)
    }

    // Configure HTTP interceptors if available
    if (options.httpService) {
      setupHttpInterceptors(options.httpService, environment)
    }

    if (options.httpClient) {
      setupHttpClientInterceptors(options.httpClient, environment)
    }

    if (options.abortManager) {
      setupAbortManagerInterceptors(options.abortManager, environment)
    }
  }
}

// Export all utility methods
export * from './methods.js'
export * from './config.js'
export * from './filters.js'
export * from './auto-monitoring.js'
export * from './vue-mixin.js'
export * from './http-interceptor.js'
