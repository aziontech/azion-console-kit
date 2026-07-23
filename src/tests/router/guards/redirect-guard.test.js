import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { redirectGuard } from '@/router/hooks/guards/redirectGuard'
import { setupCLIConfig } from '@/helpers/redirect-cli'
import { setRedirectRoute } from '@/helpers/login-redirect-manager'
import { useAccountStore } from '@/stores/account'
import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'

/**
 * redirectGuard — landing on /home either hands the session to the CLI
 * (personal token minted, hard redirect to localhost) or resumes the route
 * saved before login. Driven through REAL localStorage helpers; the only
 * seams are the HTTP adapter and window.location.
 */
const originalLocation = window.location
const router = { getRoutes: () => [{ name: 'workloads' }] }
let requestSpy

beforeEach(() => {
  setActivePinia(createPinia())
  useAccountStore().account = { utc_offset: '+0000' }
  localStorage.clear()
  requestSpy = vi
    .spyOn(AxiosHttpClientAdapter, 'request')
    .mockResolvedValue({ statusCode: 201, body: { key: 'cli-token-abc' } })
})

afterEach(() => {
  Object.defineProperty(window, 'location', { value: originalLocation, writable: true })
  vi.restoreAllMocks()
})

describe('outside home', () => {
  it('never interferes with other routes', async () => {
    const result = await redirectGuard({ to: { name: 'workloads' }, router })

    expect(result).toBeUndefined()
    expect(requestSpy).not.toHaveBeenCalled()
  })
})

describe('CLI handshake completion', () => {
  it('mints a personal token and hard-redirects to the CLI callback port', async () => {
    setupCLIConfig(2, 9182)
    const assign = vi.fn()
    Object.defineProperty(window, 'location', { value: { assign }, writable: true })

    const result = await redirectGuard({ to: { name: 'home' }, router })

    expect(result).toBe(false)
    expect(assign).toHaveBeenCalledWith('http://localhost:9182/?c=cli-token-abc')
    const tokenRequest = requestSpy.mock.calls[0][0]
    expect(tokenRequest.method).toBe('POST')
    expect(tokenRequest.body.name).toBe('cliPersonalToken')
    expect(tokenRequest.body.expires_at).toBeTruthy()
  })
})

describe('post-login route resume', () => {
  it('resumes the route saved before login and consumes the stored entry', async () => {
    setRedirectRoute({
      name: 'workloads',
      path: '/workloads',
      params: {},
      query: { page: '2' },
      fullPath: '/workloads?page=2'
    })

    const result = await redirectGuard({ to: { name: 'home' }, router })

    expect(result).toMatchObject({ name: 'workloads', query: { page: '2' } })
    expect(localStorage.getItem('redirectRoute')).toBeNull()
  })

  it('ignores a saved route that no longer exists in the router', async () => {
    setRedirectRoute({
      name: 'removed-route',
      path: '/gone',
      params: {},
      query: {},
      fullPath: '/gone'
    })

    const result = await redirectGuard({ to: { name: 'home' }, router })

    expect(result).toBe(true)
  })

  it('lets a clean home navigation through', async () => {
    const result = await redirectGuard({ to: { name: 'home' }, router })

    expect(result).toBe(true)
  })
})
