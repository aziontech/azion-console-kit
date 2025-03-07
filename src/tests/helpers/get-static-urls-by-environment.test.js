import { getStaticUrlsByEnvironment } from '@/helpers'
import { afterEach, describe, expect, it, vi } from 'vitest'

const makeSut = () => {
  const sut = getStaticUrlsByEnvironment

  return {
    sut
  }
}

const scenarios = [
  {
    section: 'manager',
    env: 'development',
    expected: 'https://stage-manager.azion.com'
  },
  {
    section: 'manager',
    env: 'stage',
    expected: 'https://stage-manager.azion.com'
  },
  {
    section: 'manager',
    env: 'production',
    expected: 'https://manager.azion.com'
  },
  {
    section: 'managerEOL',
    env: 'development',
    expected: 'https://stage-manager.azion.com/home'
  },
  {
    section: 'managerEOL',
    env: 'stage',
    expected: 'https://stage-manager.azion.com/home'
  },
  {
    section: 'managerEOL',
    env: 'production',
    expected: 'https://manager.azion.com/home'
  },
  {
    section: 'billing',
    env: 'stage',
    expected: 'https://stage-manager.azion.com/billing-subscriptions'
  },
  {
    section: 'billing',
    env: 'production',
    expected: 'https://manager.azion.com/billing-subscriptions'
  },
  {
    section: 'playgroundMetrics',
    env: 'development',
    expected: 'https://stage-api.azion.com/v4/metrics/graphql'
  },
  {
    section: 'playgroundMetrics',
    env: 'stage',
    expected: 'https://stage-api.azion.com/v4/metrics/graphql'
  },
  {
    section: 'playgroundMetrics',
    env: 'production',
    expected: 'https://api.azion.com/v4/metrics/graphql'
  },
  {
    section: 'helpCenter',
    env: 'development',
    expected: 'https://storage.googleapis.com/gcs-docs-help-center-stage/console/'
  },
  {
    section: 'helpCenter',
    env: 'stage',
    expected: 'https://storage.googleapis.com/gcs-docs-help-center-stage/console/'
  },
  {
    section: 'helpCenter',
    env: 'production',
    expected: 'https://storage.googleapis.com/gcs-docs-help-center/console/'
  }
]

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('getStaticUrlsByEnvironment', () => {
  it.each(scenarios)(
    'should return the static URL for the $section in the $env environment',
    ({ section, env, expected }) => {
      vi.stubEnv('VITE_ENVIRONMENT', env)

      const { sut } = makeSut()

      const url = sut(section)

      expect(url).toBe(expected)
    }
  )

  it('should not return a static URL when section does not exist', () => {
    const { sut } = makeSut()

    const url = sut('fake-section')

    expect(url).toBeUndefined()
  })
})
