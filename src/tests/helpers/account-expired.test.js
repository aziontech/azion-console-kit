import checkAccountStatus from '@/helpers/account-expired'
import { afterAll, describe, expect, it, vi } from 'vitest'

vi.stubGlobal('window', {
  location: {
    replace: vi.fn()
  }
})

const scenarios = {
  withRedirect: [
    {
      label: 'should redirect to billing page when client status is BLOCKED in Production env',
      env: 'production',
      status: 'BLOCKED',
      expected: 'https://manager.azion.com/billing-subscriptions/bills'
    },
    {
      label: 'should redirect to billing page when client status is DEFAULTING in Production env',
      env: 'production',
      status: 'DEFAULTING',
      expected: 'https://manager.azion.com/billing-subscriptions/bills'
    },
    {
      label: 'should redirect to billing page when client status is BLOCKED in Development env',
      env: 'development',
      status: 'BLOCKED',
      expected: 'https://stage-manager.azion.com/billing-subscriptions/bills'
    },
    {
      label: 'should redirect to billing page when client status is DEFAULTING in Development env',
      env: 'development',
      status: 'DEFAULTING',
      expected: 'https://stage-manager.azion.com/billing-subscriptions/bills'
    },
    {
      label: 'should redirect to billing page when client status is BLOCKED in Stage env',
      env: 'stage',
      status: 'BLOCKED',
      expected: 'https://stage-manager.azion.com/billing-subscriptions/bills'
    },
    {
      label: 'should redirect to billing page when client status is DEFAULTING in Stage env',
      env: 'stage',
      status: 'DEFAULTING',
      expected: 'https://stage-manager.azion.com/billing-subscriptions/bills'
    }
  ],
  withoutRedirect: [
    {
      label: 'should not redirect to billing page when client status is TRIAL in Production env',
      env: 'production',
      status: 'TRIAL'
    },
    {
      label: 'should not redirect to billing page when client status is TRIAL in Development env',
      env: 'development',
      status: 'TRIAL'
    },
    {
      label: 'should not redirect to billing page when client status is TRIAL in Stage env',
      env: 'stage',
      status: 'TRIAL'
    }
  ]
}

const makeSut = () => {
  const sut = checkAccountStatus

  return {
    sut
  }
}

describe('checkAccountStatus', () => {
  afterAll(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })

  it.each(scenarios.withRedirect)('$label', ({ status, env, expected }) => () => {
    vi.stubEnv('VITE_ENVIRONMENT', env)
    const spyReplace = vi.spyOn(window.location, 'replace')

    const { sut } = makeSut()

    sut(status)

    expect(spyReplace).toHaveBeenCalledWith(expected)
  })

  it.each(scenarios.withoutRedirect)('$label', ({ status, env }) => () => {
    vi.stubEnv('VITE_ENVIRONMENT', env)
    const spyReplace = vi.spyOn(window.location, 'replace')

    const { sut } = makeSut()

    sut(status)

    expect(spyReplace).not.toHaveBeenCalled()
  })
})
