/**
 * Sentry configuration for different environments
 * @module sentry/config
 */

const environmentConfigs = {
  production: {
    dsn: () => import.meta.env.PROD_SENTRY,
    tracesSampleRate: 0.1, // 10% - conservative sampling for production
    tracePropagationTargets: ['console.azion.com'],
    replaysSessionSampleRate: 0.01, // 1% - minimal session replay
    replaysOnErrorSampleRate: 1.0 // 100% of sessions with errors
  },
  stage: {
    dsn: () => import.meta.env.STAGE_SENTRY,
    tracesSampleRate: 0.5, // 50% - more data for staging analysis
    tracePropagationTargets: ['stage-console.azion.com', 'localhost'],
    replaysSessionSampleRate: 0.1, // 10% - moderate session replay
    replaysOnErrorSampleRate: 1.0 // 100% of sessions with errors
  }
}

export function getSentryConfig(config, options = {}) {
  const environment = import.meta.env.VITE_ENVIRONMENT

  if (!environment) return null

  const {
    dsn,
    enableLogs,
    tracesSampleRate,
    tracePropagationTargets,
    replaysSessionSampleRate,
    replaysOnErrorSampleRate
  } = environmentConfigs[environment === 'development' ? 'stage' : environment]

  if (!config) return {}

  return {
    dsn,
    environment,
    enableLogs,
    tracesSampleRate,
    tracePropagationTargets,
    replaysSessionSampleRate,
    replaysOnErrorSampleRate,
    ...options
  }
}
