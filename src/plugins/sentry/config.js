/**
 * Sentry configuration for different environments
 * @module sentry/config
 */

const dsn =
  import.meta.env.VITE_ENVIRONMENT === 'production'
    ? import.meta.env.VITE_PROD_SENTRY
    : import.meta.env.VITE_STAGE_SENTRY

const environmentConfigs = {
  production: {
    dsn,
    tracesSampleRate: 0.1, // 10% - conservative sampling for production
    tracePropagationTargets: ['console.azion.com'],
    replaysSessionSampleRate: 0.1, // 1% - minimal session replay
    replaysOnErrorSampleRate: 1.0 // 100% of sessions with errors
  },
  stage: {
    dsn,
    tracesSampleRate: 0.5, // 50% - more data for staging analysis
    tracePropagationTargets: ['stage-console.azion.com', 'localhost'],
    replaysSessionSampleRate: 0.5, // 10% - moderate session replay
    replaysOnErrorSampleRate: 1.0 // 100% of sessions with errors
  }
}

export function getSentryConfig(options = {}) {
  const environment = import.meta.env.VITE_ENVIRONMENT

  if (!environment) return null

  const {
    dsn,
    tracesSampleRate,
    tracePropagationTargets,
    replaysSessionSampleRate,
    replaysOnErrorSampleRate
  } = environmentConfigs[environment === 'development' ? 'stage' : environment]

  return {
    dsn,
    environment,
    tracesSampleRate,
    tracePropagationTargets,
    replaysSessionSampleRate,
    replaysOnErrorSampleRate,
    ...options
  }
}
