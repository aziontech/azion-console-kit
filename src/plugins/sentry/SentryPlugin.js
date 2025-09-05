import * as Sentry from '@sentry/vue'
import './sentry-feedback.css'

/**
 * Sentry Configuration
 * Environment-specific settings for Sentry error tracking
 */
const sentryConfig = {
  development: {
    dsn: 'https://39c61ac6ee89967be9965ac506cf39ff@o4505035032952832.ingest.us.sentry.io/4509962871898112',
    environment: 'development',
    tracesSampleRate: 1.0,
    replaysSessionSampleRate: 1.0, // Higher rate for development
    replaysOnErrorSampleRate: 1.0
  },
  staging: {
    dsn: 'https://39c61ac6ee89967be9965ac506cf39ff@o4505035032952832.ingest.us.sentry.io/4509962871898112',
    environment: 'staging',
    tracesSampleRate: 0.5,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0
  },
  production: {
    dsn: 'https://39c61ac6ee89967be9965ac506cf39ff@o4505035032952832.ingest.us.sentry.io/4509962871898112',
    environment: 'production',
    tracesSampleRate: 0.1, // Lower rate for production
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0
  }
}

/**
 * Get Sentry configuration based on current environment
 * @param {string} env - Environment name (development, staging, production)
 * @returns {object} Sentry configuration object
 */
function getSentryConfig(env = 'development') {
  return sentryConfig[env] || sentryConfig.development
}

/**
 * Sentry Plugin for Vue.js application
 * Provides error tracking, performance monitoring, session replay, and user feedback
 */
export default {
  install(app, options = {}) {
    // Get current environment and configuration
    const currentEnv = import.meta.env.MODE || 'development'
    const config = getSentryConfig(currentEnv)
    
    // Merge with any additional options passed to the plugin
    const {
      router = null,
      ...sentryOptions
    } = options

    // Initialize Sentry with the configuration
    Sentry.init({
      app,
      dsn: config.dsn,
      environment: config.environment,
      // Adds request headers and IP for users, for more info visit:
      // https://docs.sentry.io/platforms/javascript/guides/vue/configuration/options/#sendDefaultPii
      sendDefaultPii: true,
      integrations: [
        // Performance monitoring
        ...(router ? [Sentry.browserTracingIntegration({ router })] : []),
        // Session replay
        Sentry.replayIntegration(),
        // User feedback
        Sentry.feedbackIntegration({
          // Additional SDK configuration goes in here, for example:
          colorScheme: 'system',
          autoInject: false, // Disable automatic button injection
          showBranding: false, // Remove Sentry logo
        }),
      ],
      // Enable logs to be sent to Sentry
      enableLogs: true,
      // Set tracesSampleRate to 1.0 to capture 100%
      // of transactions for tracing.
      // We recommend adjusting this value in production
      // Learn more at
      // https://docs.sentry.io/platforms/javascript/configuration/options/#traces-sample-rate
      tracesSampleRate: config.tracesSampleRate,
      // Set `tracePropagationTargets` to control for which URLs trace propagation should be enabled
      tracePropagationTargets: ['localhost', /^https:\/\/yourserver\.io\/api/],
      // Capture Replay for 10% of all sessions,
      // plus for 100% of sessions with an error
      // Learn more at
      // https://docs.sentry.io/platforms/javascript/session-replay/configuration/#general-integration-configuration
      replaysSessionSampleRate: config.replaysSessionSampleRate,
      replaysOnErrorSampleRate: config.replaysOnErrorSampleRate,
      // Merge any additional options passed to the plugin
      ...sentryOptions,
    })

    // Create Sentry methods object
    const sentryMethods = {
      /**
       * Capture an exception manually
       * @param {Error} error - The error to capture
       * @param {object} context - Additional context information
       */
      captureException(error, context = {}) {
        Sentry.captureException(error, {
          tags: context.tags || {},
          extra: context.extra || {},
          user: context.user || {},
        })
      },

      /**
       * Capture a message manually
       * @param {string} message - The message to capture
       * @param {string} level - The severity level (error, warning, info, debug)
       * @param {object} context - Additional context information
       */
      captureMessage(message, level = 'info', context = {}) {
        Sentry.captureMessage(message, level, {
          tags: context.tags || {},
          extra: context.extra || {},
          user: context.user || {},
        })
      },

      /**
       * Set user context for error tracking
       * @param {object} user - User information (id, email, username, etc.)
       */
      setUser(user) {
        Sentry.setUser(user)
      },

      /**
       * Set additional context/tags for error tracking
       * @param {object} context - Context information
       */
      setContext(context) {
        Sentry.setContext('custom', context)
      },

      /**
       * Set tags for error tracking
       * @param {object} tags - Key-value pairs of tags
       */
      setTags(tags) {
        Sentry.setTags(tags)
      },

      /**
       * Add breadcrumb for debugging
       * @param {object} breadcrumb - Breadcrumb information
       */
      addBreadcrumb(breadcrumb) {
        Sentry.addBreadcrumb(breadcrumb)
      },

      /**
       * Start a transaction for performance monitoring
       * @param {string} name - Transaction name
       * @param {string} op - Operation type
       * @returns {object} Transaction object
       */
      startTransaction(name, op = 'navigation') {
        return Sentry.startTransaction({ name, op })
      },

      /**
       * Show user feedback dialog
       * @param {object} options - Feedback options
       */
      showFeedback(options = {}) {
        Sentry.showReportDialog(options)
      },


      /**
       * Create and show feedback form
       * @param {object} options - Feedback form options
       */
      async createFeedbackForm(options = {}) {
        const feedback = Sentry.getFeedback()
        if (feedback) {
          const form = await feedback.createForm({
            // Default options for centered modal
            showBranding: false,
            ...options
          })
          
          form.appendToDom()
          form.open()
          
          // CSS handles all modal styling automatically
        }
      },

      /**
       * Get the Sentry instance for advanced usage
       * @returns {object} Sentry instance
       */
      getSentry() {
        return Sentry
      }
    }

    // Make Sentry methods available globally
    app.config.globalProperties.$sentry = sentryMethods
    app.provide('sentry', sentryMethods)
  }
}
