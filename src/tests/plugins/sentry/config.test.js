import { describe, it, expect, vi, afterEach } from 'vitest'
import { getSentryConfig } from '@/plugins/sentry/config'
import { getRuntimeConfig } from '@/helpers/runtime-config'

vi.mock('@/helpers/runtime-config', () => ({
  getRuntimeConfig: vi.fn(() => ({}))
}))

afterEach(() => {
  vi.unstubAllEnvs()
  getRuntimeConfig.mockReset()
  getRuntimeConfig.mockReturnValue({})
})

describe('getSentryConfig', () => {
  it('should return null when no environment is available anywhere', () => {
    vi.stubEnv('VITE_ENVIRONMENT', '')

    expect(getSentryConfig()).toBeNull()
  })

  it('should return null for an unknown environment', () => {
    getRuntimeConfig.mockReturnValue({ environment: 'qa' })

    expect(getSentryConfig()).toBeNull()
  })

  it('should resolve environment and dsn from the runtime config first', () => {
    getRuntimeConfig.mockReturnValue({ environment: 'production', sentryDsn: 'runtime-dsn' })
    vi.stubEnv('VITE_ENVIRONMENT', 'stage')
    vi.stubEnv('VITE_PROD_SENTRY', 'build-time-dsn')

    const config = getSentryConfig()

    expect(config.environment).toBe('production')
    expect(config.dsn).toBe('runtime-dsn')
    expect(config.tracesSampleRate).toBe(0.1)
    expect(config.tracePropagationTargets).toEqual(['console.azion.com'])
  })

  it('should fall back to VITE_ENVIRONMENT when the runtime config has none', () => {
    vi.stubEnv('VITE_ENVIRONMENT', 'stage')

    const config = getSentryConfig()

    expect(config.environment).toBe('stage')
    expect(config.tracesSampleRate).toBe(0.5)
  })

  it('should fall back to VITE_PROD_SENTRY on production without runtime dsn', () => {
    getRuntimeConfig.mockReturnValue({ environment: 'production' })
    vi.stubEnv('VITE_PROD_SENTRY', 'prod-dsn')

    expect(getSentryConfig().dsn).toBe('prod-dsn')
  })

  it('should fall back to VITE_STAGE_SENTRY outside production without runtime dsn', () => {
    getRuntimeConfig.mockReturnValue({ environment: 'stage' })
    vi.stubEnv('VITE_STAGE_SENTRY', 'stage-dsn')

    expect(getSentryConfig().dsn).toBe('stage-dsn')
  })

  it('should map development to the stage profile while keeping the environment name', () => {
    getRuntimeConfig.mockReturnValue({ environment: 'development', sentryDsn: 'dev-dsn' })

    const config = getSentryConfig()

    expect(config.environment).toBe('development')
    expect(config.tracesSampleRate).toBe(0.5)
    expect(config.dsn).toBe('dev-dsn')
  })

  it('should let caller options override the environment profile', () => {
    getRuntimeConfig.mockReturnValue({ environment: 'production', sentryDsn: 'runtime-dsn' })

    const config = getSentryConfig({ tracesSampleRate: 1, release: 'v1.2.3' })

    expect(config.tracesSampleRate).toBe(1)
    expect(config.release).toBe('v1.2.3')
  })
})
