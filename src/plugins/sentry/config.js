/**
 * Sentry configuration for different environments
 * @module sentry/config
 */

/**
 * Environment-specific configurations following industry best practices
 */
const environmentConfigs = {
  production: {
    dsn: () => import.meta.env.PROD_SENTRY,
    enableLogs: false, // Disable logs in production for performance
    tracesSampleRate: 0.1, // 10% - conservative sampling for production
    tracePropagationTargets: ['console.azion.com'],
    replaysSessionSampleRate: 0.01, // 1% - minimal session replay
    replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors
    debug: false,
    silent: true
  },
  stage: {
    dsn: () =>
      import.meta.env.STAGE_SENTRY ||
      'https://8480d3940a656261bf3813bb5c9fdaf5@o4505035032952832.ingest.us.sentry.io/4510024014561280',
    enableLogs: true, // Enable logs in staging for debugging
    tracesSampleRate: 0.5, // 50% - more data for staging analysis
    tracePropagationTargets: ['stage-console.azion.com'],
    replaysSessionSampleRate: 0.1, // 10% - moderate session replay
    replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors
    debug: false,
    silent: false
  }
}

/**
 * Gets DSN based on environment flags
 * @returns {string|null} Sentry DSN or null if not configured
 */
export function getSentryDSN() {
  const environment = import.meta.env.VITE_ENVIRONMENT

  if (!environment) return null

  const config = environmentConfigs[environment]
  if (!config) return null

  return config.dsn() || null
}

/**
 * Checks if Sentry should be enabled
 * @returns {boolean} True if Sentry should be enabled
 */
export function shouldEnableSentry() {
  const dsn = getSentryDSN()

  return !!dsn
}

/**
 * Gets Sentry configuration for the current environment
 * @param {string} dsn - Sentry DSN
 * @param {Object} options - Additional options
 * @returns {Object} Sentry configuration
 */
export function getSentryConfig(dsn, options = {}) {
  const environment = import.meta.env.VITE_ENVIRONMENT

  if (!environment) return {}

  const config = environmentConfigs[environment]
  if (!config) return {}

  return {
    dsn,
    environment,
    enableLogs: config.enableLogs,
    tracesSampleRate: config.tracesSampleRate,
    tracePropagationTargets: config.tracePropagationTargets,
    replaysSessionSampleRate: config.replaysSessionSampleRate,
    replaysOnErrorSampleRate: config.replaysOnErrorSampleRate,
    debug: config.debug,
    silent: config.silent,
    ...options
  }
}
