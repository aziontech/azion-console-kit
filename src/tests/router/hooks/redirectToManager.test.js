import { describe, afterAll, it, expect, vi } from 'vitest'
import redirectToManager from '@/router/hooks/guards/redirectToManagerGuard.js'

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

  const guardDependency = {
    accountStore,
    loadContractServicePlan
  }

  const routeHandler = {
    to: { meta: { isPublic: !isPrivateRoute }, name: 'some-route' },
    from: { name: fromName },
    next: vi.fn()
  }

  return { guardDependency, routeHandler }
}

afterAll(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

describe('redirectToManager', () => {
  it('should call next if user has an active user id and is on a non-private route', async () => {
    const windowLocationReplaceMock = vi.spyOn(window.location, 'replace')
    const { routeHandler, guardDependency } = makeSut({
      hasActiveUserId: true,
      isPrivateRoute: false
    })
    await redirectToManager(routeHandler, guardDependency)

    expect(windowLocationReplaceMock).not.toHaveBeenCalled()
    expect(routeHandler.next).toHaveBeenCalled()
  })

  it('should allow full access for users with an @azion.com account', async () => {
    const windowLocationReplaceMock = vi.spyOn(window.location, 'replace')

    const { routeHandler, guardDependency } = makeSut({
      hasActiveUserId: true,
      isPrivateRoute: true,
      email: '@azion.com'
    })
    await redirectToManager(routeHandler, guardDependency)

    expect(routeHandler.next).toHaveBeenCalled()
    expect(windowLocationReplaceMock).not.toHaveBeenCalled()
  })

  it('should allow access for accounts with Developer type', async () => {
    const windowLocationReplaceMock = vi.spyOn(window.location, 'replace')

    const { routeHandler, guardDependency } = makeSut({
      hasActiveUserId: true,
      isPrivateRoute: true,
      email: '@developer.com',
      clientId: '123',
      isDeveloperSupportPlan: true
    })
    await redirectToManager(routeHandler, guardDependency)

    expect(guardDependency.accountStore.setAccountData).toHaveBeenCalledWith({
      isDeveloperSupportPlan: true
    })
    expect(routeHandler.next).toHaveBeenCalled()
    expect(windowLocationReplaceMock).not.toHaveBeenCalled()
  })
  it('should redirect non-developer accounts to the RTM', async () => {
    const windowLocationReplaceMock = vi.spyOn(window.location, 'replace')

    const { routeHandler, guardDependency } = makeSut({
      hasActiveUserId: true,
      isPrivateRoute: true,
      hasAccessConsole: false,
      email: '@developer.com',
      clientId: '123',
      isDeveloperSupportPlan: false
    })
    await redirectToManager(routeHandler, guardDependency)

    expect(guardDependency.accountStore.setAccountData).toHaveBeenCalledWith({
      isDeveloperSupportPlan: false
    })
    expect(windowLocationReplaceMock).toHaveBeenCalled()
  })

  it('should redirect to the RTM when accountData does not have a client_id', async () => {
    const windowLocationReplaceMock = vi.spyOn(window.location, 'replace')

    const { routeHandler, guardDependency } = makeSut({
      hasActiveUserId: true,
      isPrivateRoute: true,
      email: '@developer.com',
      clientId: null
    })

    await redirectToManager(routeHandler, guardDependency)

    expect(windowLocationReplaceMock).toHaveBeenCalled()
    expect(routeHandler.next).toHaveBeenCalled()
  })

  it('should handle navigation restriction for metrics only access', async () => {
    const windowLocationReplaceMock = vi.spyOn(window.location, 'replace')

    const { routeHandler, guardDependency } = makeSut({
      hasActiveUserId: true,
      isPrivateRoute: true,
      metricsOnlyAccessRestriction: true
    })

    await redirectToManager(routeHandler, guardDependency)

    expect(windowLocationReplaceMock).not.toHaveBeenCalled()
    expect(routeHandler.next).toHaveBeenCalled({ name: 'real-time-metrics' })
  })

  it('should handle navigation restriction for metrics only access and from.name is not metrics', async () => {
    const windowLocationReplaceMock = vi.spyOn(window.location, 'replace')

    const { routeHandler, guardDependency } = makeSut({
      hasActiveUserId: true,
      isPrivateRoute: true,
      metricsOnlyAccessRestriction: true,
      fromName: 'real-time-metrics'
    })

    await redirectToManager(routeHandler, guardDependency)

    expect(windowLocationReplaceMock).not.toHaveBeenCalled()
    expect(routeHandler.next).toHaveBeenCalledWith(false)
  })

  it('should allow access for accounts with console access', async () => {
    const windowLocationReplaceMock = vi.spyOn(window.location, 'replace')

    const { routeHandler, guardDependency } = makeSut({
      hasActiveUserId: true,
      isPrivateRoute: true,
      hasAccessConsole: true
    })

    await redirectToManager(routeHandler, guardDependency)

    expect(windowLocationReplaceMock).not.toHaveBeenCalled()
    expect(routeHandler.next).toHaveBeenCalled()
  })
})
