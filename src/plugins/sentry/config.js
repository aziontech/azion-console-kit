/**
 * Sentry configurations for different environments
 * @module sentry/config
 */

/**
 * Domain configurations for Sentry
 * @type {Object}
 */
export const domainConfig = {
  /**
   * Allowed domains for tracing and monitoring
   * Includes subdomains for azionedge.net and azion.com
   * @type {string[]}
   */
  tracingOrigins: ['*.azionedge.net', '*.azion.com', 'azionedge.net', 'azion.com']
}

/**
 * Environment-specific configurations
 * @type {Object.<string, Object>}
 */
export const environmentConfigs = {
  development: {
    enabled: false,
    debug: false,
    tracesSampleRate: 0,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
    enablePerformance: false,
    enableSessionReplay: false,
    enableAutoMonitoring: false
  },
  stage: {
    enabled: true,
    debug: true,
    tracesSampleRate: 0, // Disable performance monitoring
    replaysSessionSampleRate: 0, // Disable session replay
    replaysOnErrorSampleRate: 0, // Disable session replay
    enablePerformance: false, // Disable performance monitoring
    enableSessionReplay: false, // Disable session replay
    enableAutoMonitoring: true, // Only JavaScript errors
    enableNetworkMonitoring: false // Disable network monitoring
  },
  production: {
    enabled: true,
    debug: false,
    tracesSampleRate: 0.1, // 10% performance sampling
    replaysSessionSampleRate: 0, // No regular session replay
    replaysOnErrorSampleRate: 0.1, // 10% session replay only on new errors
    enablePerformance: true, // Enable performance monitoring
    enableSessionReplay: true, // Enable session replay
    enableAutoMonitoring: true, // Enable automatic monitoring
    enableNetworkMonitoring: false, // Disable network monitoring
    silent: true // Don't display errors in console
  }
}

/**
 * Security and filter configurations
 * @type {Object}
 */
export const securityConfig = {
  /**
   * Sensitive URLs that should be filtered from breadcrumbs
   * @type {string[]}
   */
  sensitiveUrls: ['/api/auth', '/api/token', '/api/password', '/api/totp'],

  /**
   * Error types that should be ignored
   * @type {string[]}
   */
  ignoredErrors: ['NetworkError', 'Failed to fetch', 'Network request failed', 'AbortError'],

  /**
   * Allowed domains for tracing
   * @type {string[]}
   */
  tracingOrigins: domainConfig.tracingOrigins
}

/**
 * Default Sentry configurations
 * @type {Object}
 */
export const defaultConfig = {
  /**
   * Integration configurations
   */
  integrations: [],

  /**
   * Breadcrumb configurations
   */
  beforeBreadcrumb: null,

  /**
   * Filter configurations
   */
  beforeSend: null,

  /**
   * Context configurations
   */
  defaultTags: {},

  /**
   * Debug configurations
   */
  debug: false
}

/**
 * Gets configuration for the current environment
 * @param {string} environment - Application environment
 * @returns {Object} Environment configuration
 */
export function getEnvironmentConfig(environment) {
  return environmentConfigs[environment] || environmentConfigs.development
}

/**
 * Checks if Sentry should be enabled for the environment
 * @param {string} environment - Application environment
 * @returns {boolean} True if Sentry should be enabled
 */
export function shouldEnableSentry(environment) {
  const config = getEnvironmentConfig(environment)
  return config.enabled
}

/**
 * Gets complete Sentry configuration
 * @param {string} environment - Application environment
 * @param {string} dsn - Sentry DSN
 * @param {Object} options - Additional options
 * @returns {Object} Complete Sentry configuration
 */
export function getSentryConfig(environment, dsn, options = {}) {
  const envConfig = getEnvironmentConfig(environment)

  return {
    dsn,
    environment,
    debug: envConfig.debug,
    tracesSampleRate: envConfig.tracesSampleRate,
    replaysSessionSampleRate: envConfig.replaysSessionSampleRate,
    replaysOnErrorSampleRate: envConfig.replaysOnErrorSampleRate,
    silent: envConfig.silent || false,
    ...options
  }
}
