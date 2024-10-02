import { describe, afterAll, it, expect, vi } from 'vitest'
import { redirectToManagerGuard } from '@/router/hooks/guards/redirectToManagerGuard.js'

vi.stubGlobal('window', {
  location: {
    replace: vi.fn()
  }
})

const makeSut = (scenario) => {
  const {
    hasActiveUserId = false,
    isPrivateRoute,
    hasAccessConsole,
    metricsOnlyAccessRestriction,
    email = '',
    clientId,
    isDeveloperSupportPlan,
    fromName = ''
  } = scenario

  const accountStore = {
    hasActiveUserId: hasActiveUserId,
    hasAccessConsole: hasAccessConsole,
    metricsOnlyAccessRestriction: metricsOnlyAccessRestriction,
    accountData: {
      email: email,
      client_id: clientId
    },
    setAccountData: vi.fn()
  }

  const loadContractServicePlan = vi.fn().mockResolvedValue({ isDeveloperSupportPlan })

  return {
    accountStore,
    loadContractServicePlan,
    to: { meta: { isPublic: !isPrivateRoute }, name: 'some-route' },
    from: { name: fromName }
  }
}

afterAll(() => {
  vi.unstubAllGlobals()
})

describe('redirectToManagerGuard', () => {
  it('should call next if user has an active user id and is on a non-private route', async () => {
    const windowLocationReplaceMock = vi.spyOn(window.location, 'replace')
    const dependencies = makeSut({
      hasActiveUserId: true,
      isPrivateRoute: false
    })
    const result = await redirectToManagerGuard(dependencies)

    expect(windowLocationReplaceMock).not.toHaveBeenCalled()
    expect(result).toBeTruthy()
  })

  it('should allow full access for users with an @azion.com account', async () => {
    const windowLocationReplaceMock = vi.spyOn(window.location, 'replace')

    const dependencies = makeSut({
      hasActiveUserId: true,
      isPrivateRoute: true,
      email: '@azion.com'
    })

    const result = await redirectToManagerGuard(dependencies)

    expect(result).toBeTruthy()
    expect(windowLocationReplaceMock).not.toHaveBeenCalled()
  })

  it('should allow access for accounts with Developer type', async () => {
    const windowLocationReplaceMock = vi.spyOn(window.location, 'replace')

    const dependencies = makeSut({
      hasActiveUserId: true,
      isPrivateRoute: true,
      email: '@developer.com',
      clientId: '123',
      isDeveloperSupportPlan: true
    })

    const result = await redirectToManagerGuard(dependencies)

    expect(dependencies.accountStore.setAccountData).toHaveBeenCalledWith({
      isDeveloperSupportPlan: true
    })
    expect(result).toBeTruthy()
    expect(windowLocationReplaceMock).not.toHaveBeenCalled()
  })
  it('should redirect non-developer accounts to the RTM', async () => {
    const windowLocationReplaceMock = vi.spyOn(window.location, 'replace')

    const dependencies = makeSut({
      hasActiveUserId: true,
      isPrivateRoute: true,
      hasAccessConsole: false,
      email: '@developer.com',
      clientId: '123',
      isDeveloperSupportPlan: false
    })
    const result = await redirectToManagerGuard(dependencies)

    expect(dependencies.accountStore.setAccountData).toHaveBeenCalledWith({
      isDeveloperSupportPlan: false
    })
    expect(windowLocationReplaceMock).toHaveBeenCalled()
    expect(result).toBeTruthy()
  })

  it('should redirect to the RTM when accountData does not have a client_id', async () => {
    const windowLocationReplaceMock = vi.spyOn(window.location, 'replace')

    const dependencies = makeSut({
      hasActiveUserId: true,
      isPrivateRoute: true,
      email: '@developer.com',
      clientId: null
    })

    const result = await redirectToManagerGuard(dependencies)

    expect(windowLocationReplaceMock).toHaveBeenCalled()
    expect(result).toBeTruthy()
  })

  it('should handle navigation restriction for metrics only access', async () => {
    const windowLocationReplaceMock = vi.spyOn(window.location, 'replace')

    const dependencies = makeSut({
      hasActiveUserId: true,
      isPrivateRoute: true,
      metricsOnlyAccessRestriction: true
    })

    const result = await redirectToManagerGuard(dependencies)

    expect(windowLocationReplaceMock).not.toHaveBeenCalled()
    expect(result).toEqual({ name: 'real-time-metrics' })
  })

  it('should handle navigation restriction for metrics only access and from.name is not metrics', async () => {
    const windowLocationReplaceMock = vi.spyOn(window.location, 'replace')

    const dependencies = makeSut({
      hasActiveUserId: true,
      isPrivateRoute: true,
      metricsOnlyAccessRestriction: true,
      fromName: 'real-time-metrics'
    })

    const result = await redirectToManagerGuard(dependencies)

    expect(windowLocationReplaceMock).not.toHaveBeenCalled()
    expect(result).toBeFalsy()
  })

  it('should allow access for accounts with console access', async () => {
    const windowLocationReplaceMock = vi.spyOn(window.location, 'replace')

    const dependencies = makeSut({
      hasActiveUserId: true,
      isPrivateRoute: true,
      hasAccessConsole: true
    })

    const result = await redirectToManagerGuard(dependencies)

    expect(windowLocationReplaceMock).not.toHaveBeenCalled()
    expect(result).toBeTruthy()
  })
})
