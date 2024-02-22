import { getStaticUrlsByEnvironment } from '@/helpers'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const scenarios = [
  {
    section: 'manager',
    env: 'development',
    expected: 'https://stage-manag.azion.co'
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
    section: 'billing',
    env: 'development',
    expected: 'https://stage-manager.azion.com/billing-subscriptions/bills'
  },
  {
    section: 'billing',
    env: 'stage',
    expected: 'https://stage-manager.azion.com/billing-subscriptions/bills'
  },
  {
    section: 'billing',
    env: 'production',
    expected: 'https://manager.azion.com/billing-subscriptions/bills'
  },
  {
    section: 'playground',
    env: 'development',
    expected: 'https://stage-manager.azion.com/metrics/graphql'
  },
  {
    section: 'playground',
    env: 'stage',
    expected: 'https://stage-manager.azion.com/metrics/graphql'
  },
  {
    section: 'playground',
    env: 'production',
    expected: 'https://manager.azion.com/metrics/graphql'
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

const makeSut = () => {
  const sut = getStaticUrlsByEnvironment

  return {
    sut
  }
}

describe('getStaticUrlsByEnvironment', () => {
  beforeEach(() => {
    vi.unstubAllEnvs()
  })
  it.each(scenarios)(
    'should return the static URL for $section in $env environment',
    ({ section, env, expected }) =>
      () => {
        vi.stubEnv('MODE', env)

        const { sut } = makeSut()

        const result = sut(section)

        expect(result).toBe(expected)
      }
  )
})
