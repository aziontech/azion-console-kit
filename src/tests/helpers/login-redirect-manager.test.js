import { setRedirectRoute, getRedirectRoute } from '@/helpers/login-redirect-manager'
import { afterAll, describe, expect, it, vi } from 'vitest'

const routerMock = {
  getRoutes: () => [
    { name: 'dashboard', path: '/dashboard', params: {}, query: {}, fullPath: '/dashboard' }
  ]
}
describe('loginRedirectManager', () => {
  afterAll(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('should set a redirect route in localStorage', () => {
    const route = {
      name: 'dashboard',
      path: '/dashboard',
      params: {},
      query: {},
      fullPath: '/dashboard'
    }
    setRedirectRoute(route)
    const storedRoute = localStorage.getItem('redirectRoute')
    expect(storedRoute).not.toBeNull()
  })

  it('should get a redirect route from localStorage and validate it', () => {
    const route = {
      name: 'dashboard',
      path: '/dashboard',
      params: {},
      query: {},
      fullPath: '/dashboard'
    }
    setRedirectRoute(route)
    const retrievedRoute = getRedirectRoute(routerMock)
    expect(retrievedRoute).toEqual(
      expect.objectContaining({
        name: 'dashboard',
        path: '/dashboard'
      })
    )
  })

  it('should remove the redirect route from localStorage after retrieval', () => {
    const route = {
      name: 'dashboard',
      path: '/dashboard',
      params: {},
      query: {},
      fullPath: '/dashboard'
    }
    setRedirectRoute(route)
    getRedirectRoute(routerMock)
    const storedRoute = localStorage.getItem('redirectRoute')
    expect(storedRoute).toBeNull()
  })

  it('should not set a redirect route if the path is root', () => {
    const route = {
      name: 'home',
      path: '/',
      params: {},
      query: {},
      fullPath: '/'
    }
    setRedirectRoute(route)
    const storedRoute = localStorage.getItem('redirectRoute')
    expect(storedRoute).toBeNull()
  })

  it('should return null if the redirect route is expired', () => {
    const route = {
      name: 'dashboard',
      path: '/dashboard',
      params: {},
      query: {},
      fullPath: '/dashboard'
    }
    const expirationMinutes = -1
    setRedirectRoute(route, expirationMinutes)
    const retrievedRoute = getRedirectRoute(routerMock)
    expect(retrievedRoute).toBeNull()
  })

  it('should return null if the redirect route is not valid', () => {
    const invalidRoute = {
      name: 'nonexistent',
      path: '/nonexistent',
      params: {},
      query: {},
      fullPath: '/nonexistent',
      expiresAt: new Date().getTime() + 60000 // 1 minute from now
    }
    const encryptedData = btoa(JSON.stringify(invalidRoute))
    localStorage.setItem('redirectRoute', encryptedData)
    const retrievedRoute = getRedirectRoute(routerMock)
    expect(retrievedRoute).toBeNull()
  })
})
