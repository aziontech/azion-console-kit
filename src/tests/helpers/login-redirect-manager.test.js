import { describe, it, expect, beforeEach, vi } from 'vitest'
import { isValidRoute, setRedirectRoute, getRedirectRoute } from '@/helpers/login-redirect-manager'
import router from '@/router'

describe('login-redirect-manager', () => {
  beforeEach(() => {
    vi.spyOn(router, 'getRoutes').mockImplementation(() => [{ name: 'validRoute' }])
    localStorage.clear()
  })

  describe('isValidRoute', () => {
    it('should return true for a valid route', () => {
      const result = isValidRoute({ name: 'validRoute' })
      expect(result).toBeTruthy()
    })

    it('should return false for an invalid route', () => {
      const result = isValidRoute({ name: 'invalidRoute' })
      expect(result).toBeFalsy()
    })
  })

  describe('setRedirectRoute', () => {
    it('should store the correct data in localStorage', () => {
      const to = {
        name: 'testRoute',
        path: '/test',
        params: { id: 1 },
        query: { queryParam: 'search' },
        fullPath: '/test?id=1&queryParam=search'
      }
      const expirationMinutes = 60
      const now = new Date()
      const expiration = new Date(now.getTime() + expirationMinutes * 60000)

      setRedirectRoute(to, expirationMinutes)

      const storedData = JSON.parse(atob(localStorage.getItem('redirectRoute')))
      expect(storedData).toMatchObject({
        name: 'testRoute',
        path: '/test',
        params: { id: 1 },
        query: { queryParam: 'search' },
        fullPath: '/test?id=1&queryParam=search',
        expiresAt: expiration.getTime()
      })
    })
  })

  describe('getRedirectRoute', () => {
    it('should return the correct route if data is valid and not expired', () => {
      const now = new Date()
      const expiration = new Date(now.getTime() + 60000)
      const redirectData = {
        name: 'validRoute',
        path: '/test',
        params: { id: 1 },
        query: { queryParam: 'search' },
        fullPath: '/test?id=1&queryParam=search',
        expiresAt: expiration.getTime()
      }

      localStorage.setItem('redirectRoute', btoa(JSON.stringify(redirectData)))

      const result = getRedirectRoute()
      expect(result).toMatchObject(redirectData)
    })

    it('should return null if data is expired', () => {
      const now = new Date()
      const expiration = new Date(now.getTime() - 60000)
      const redirectData = {
        name: 'testRoute',
        path: '/test',
        params: { id: 1 },
        query: { queryParam: 'search' },
        fullPath: '/test?id=1&queryParam=search',
        expiresAt: expiration.getTime()
      }
      localStorage.setItem('redirectRoute', btoa(JSON.stringify(redirectData)))

      const result = getRedirectRoute()
      expect(result).toBeNull()
    })

    it('should return null if route is not valid', () => {
      const now = new Date()
      const expiration = new Date(now.getTime() + 60000)
      const redirectData = {
        name: 'invalidRoute',
        path: '/test',
        params: { id: 1 },
        query: { queryParam: 'search' },
        fullPath: '/test?id=1&queryParam=search',
        expiresAt: expiration.getTime()
      }
      localStorage.setItem('redirectRoute', btoa(JSON.stringify(redirectData)))

      const result = getRedirectRoute()
      expect(result).toBeNull()
    })
  })
})
