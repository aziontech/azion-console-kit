// @vitest-environment node
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest'
import { AccountService } from '@/services/v2/account/account-service'
import { spyHttpRequest } from '../../../support/versioning/boundaries'

/**
 * AccountService — the session's identity source (test-maturity deep pass).
 * Adaptation matrix pinned: `kind` drives icon/name shown across the shell.
 */
const service = () => new AccountService()

beforeEach(() => {
  service().queryClient.clear()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('fetchAccountInfo', () => {
  it('GETs account/info on the /api base and enriches the payload', async () => {
    const http = spyHttpRequest()
    http.respondWith({ id: 1, name: 'Acme', kind: 'client' })

    const result = await service().fetchAccountInfo()

    expect(http.spy.mock.calls.at(-1)[0]).toMatchObject({
      method: 'GET',
      url: 'account/info',
      config: { baseURL: '/api' }
    })
    expect(result).toMatchObject({
      id: 1,
      name: 'Acme',
      accountTypeName: 'Client',
      accountTypeIcon: 'pi pi-box'
    })
  })

  it.each([
    // PINNED quirk: singular "reseller" maps to Group, plural "resellers" to Reseller
    { kind: 'reseller', accountTypeName: 'Group', accountTypeIcon: 'pi pi-folder' },
    { kind: 'resellers', accountTypeName: 'Reseller', accountTypeIcon: 'pi pi-building' },
    { kind: 'brand', accountTypeName: 'Brand', accountTypeIcon: 'pi pi-globe' }
  ])('maps kind=$kind to $accountTypeName', async ({ kind, accountTypeName, accountTypeIcon }) => {
    const http = spyHttpRequest()
    http.respondWith({ kind })

    const result = await service().fetchAccountInfo()

    expect(result.accountTypeName).toBe(accountTypeName)
    expect(result.accountTypeIcon).toBe(accountTypeIcon)
  })

  it('handles an unknown kind without inventing labels', async () => {
    const http = spyHttpRequest()
    http.respondWith({ kind: 'martian' })

    const result = await service().fetchAccountInfo()

    expect(result.accountTypeName).toBeUndefined()
    expect(result.accountTypeIcon).toBeNull()
  })

  it('passes an empty body through untouched', async () => {
    const http = spyHttpRequest()
    http.respondWith(null)

    await expect(service().fetchAccountInfo()).resolves.toBeNull()
  })

  it('propagates HTTP failures instead of swallowing them', async () => {
    const http = spyHttpRequest()
    http.rejectNext(new Error('401'))

    await expect(service().fetchAccountInfo()).rejects.toThrow('401')
  })
})

describe('getAccountInfo — query cache', () => {
  it('serves the second call from cache without re-hitting HTTP', async () => {
    const http = spyHttpRequest()
    http.respondWith({ id: 1, kind: 'client' })

    const sut = service()
    const first = await sut.getAccountInfo()
    const second = await sut.getAccountInfo()

    expect(http.spy).toHaveBeenCalledTimes(1)
    expect(second).toEqual(first)
  })
})
