// @vitest-environment node
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest'
import { UserService } from '@/services/v2/account/user-service'
import { spyHttpRequest } from '../../../support/versioning/boundaries'

/** UserService — user/me identity fetch + cache (test-maturity deep pass). */
const service = () => new UserService()

beforeEach(() => {
  service().queryClient.clear()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('fetchUserInfo', () => {
  it('GETs user/me on the /api base and returns the payload verbatim', async () => {
    const http = spyHttpRequest()
    http.respondWith({ id: 7, email: 'dev@azion.com', is_staff: false })

    const result = await service().fetchUserInfo()

    expect(http.spy.mock.calls.at(-1)[0]).toMatchObject({
      method: 'GET',
      url: 'user/me',
      config: { baseURL: '/api' }
    })
    expect(result).toEqual({ id: 7, email: 'dev@azion.com', is_staff: false })
  })

  it('propagates HTTP failures', async () => {
    const http = spyHttpRequest()
    http.rejectNext(new Error('session expired'))

    await expect(service().fetchUserInfo()).rejects.toThrow('session expired')
  })
})

describe('getUserInfo — query cache', () => {
  it('serves the second call from cache without re-hitting HTTP', async () => {
    const http = spyHttpRequest()
    http.respondWith({ id: 7 })

    const sut = service()
    await sut.getUserInfo()
    await sut.getUserInfo()

    expect(http.spy).toHaveBeenCalledTimes(1)
  })
})
