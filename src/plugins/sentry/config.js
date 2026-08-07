/**
 * Sentry configuration for different environments
 * @module sentry/config
 */
import { getRuntimeConfig } from '@/helpers/runtime-config'

const environmentConfigs = {
  production: {
    tracesSampleRate: 0.1, // 10% - conservative sampling for production
    tracePropagationTargets: ['console.azion.com'],
    replaysSessionSampleRate: 0.1, // 1% - minimal session replay
    replaysOnErrorSampleRate: 1.0 // 100% of sessions with errors
  },
  stage: {
    tracesSampleRate: 0.5, // 50% - more data for staging analysis
    tracePropagationTargets: ['stage-console.azion.com', 'localhost'],
    replaysSessionSampleRate: 0.5, // 10% - moderate session replay
    replaysOnErrorSampleRate: 1.0 // 100% of sessions with errors
  }
}

const resolveDsn = (environment) => {
  const runtimeDsn = getRuntimeConfig().sentryDsn
  if (runtimeDsn) return runtimeDsn

  return environment === 'production'
    ? import.meta.env.VITE_PROD_SENTRY
    : import.meta.env.VITE_STAGE_SENTRY
}

export function getSentryConfig(options = {}) {
  const environment = getRuntimeConfig().environment || import.meta.env.VITE_ENVIRONMENT

  if (!environment) return null

  const config = environmentConfigs[environment === 'development' ? 'stage' : environment]

  if (!config) return null

  const dsn = resolveDsn(environment)

  const {
    tracesSampleRate,
    tracePropagationTargets,
    replaysSessionSampleRate,
    replaysOnErrorSampleRate
  } = config

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
