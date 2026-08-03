// @vitest-environment node
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest'
import { AccountService, accountService } from '@/services/v2/account/account-service'
import { httpService } from '@/services/v2/base/http/httpService'
import { queryKeys } from '@/services/v2/base/query/queryKeys'
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

// ─────────────────────────────────────────────────────────────────────────────
// Identity composition — coverage for the ENG-46685 fix (switch account kept a
// stale account). Merged from PR #3658 (author: HerbertJulio); the module mock
// was dropped in favor of the same real-instance HTTP spy the rest of the
// suite uses.
// ─────────────────────────────────────────────────────────────────────────────
const mockRequestByUrl = (responsesByUrl) =>
  vi.spyOn(httpService, 'request').mockImplementation(({ url }) => {
    if (url in responsesByUrl) return Promise.resolve(responsesByUrl[url])
    throw new Error(`unexpected request url: ${url}`)
  })

describe('fetchAccountIdentity — single source of truth (ENG-46685)', () => {
  it('composes account/info, user/me and job-role into a single identity object', async () => {
    mockRequestByUrl({
      'account/info': {
        data: {
          id: 100,
          name: 'Acme',
          kind: 'client',
          client_id: 'client-100',
          client_flags: ['allow_console'],
          status: 'ONLINE'
        }
      },
      'user/me': {
        data: {
          id: 55,
          client_id: 'client-100',
          is_account_owner: true,
          email: 'user@acme.com',
          first_name: 'Ada',
          last_name: 'Lovelace',
          timezone: 'UTC',
          utc_offset: '+0000',
          permissions: [{ name: 'View Data Stream' }]
        }
      },
      'v4/iam/account': { data: { data: { job_function: 'software-developer' } } }
    })

    const identity = await accountService.fetchAccountIdentity()

    expect(identity).toMatchObject({
      id: 100,
      name: 'Acme',
      kind: 'client',
      client_id: 'client-100',
      status: 'ONLINE',
      jobRole: 'software-developer',
      is_account_owner: true,
      email: 'user@acme.com',
      first_name: 'Ada',
      last_name: 'Lovelace',
      timezone: 'UTC',
      utc_offset: '+0000',
      user_id: 55,
      isDeveloperSupportPlan: true
    })
    expect(identity.accountTypeName).toBeDefined()
    expect(identity.accountTypeIcon).toBeDefined()
  })

  it('supports user payloads wrapped in a results field', async () => {
    mockRequestByUrl({
      'account/info': { data: { id: 1, kind: 'client' } },
      'user/me': { data: { results: { id: 9, client_id: 'client-9', email: 'r@acme.com' } } },
      'v4/iam/account': { data: { data: { job_function: 'other' } } }
    })

    const identity = await accountService.fetchAccountIdentity()

    expect(identity.user_id).toBe(9)
    expect(identity.client_id).toBe('client-9')
    expect(identity.email).toBe('r@acme.com')
  })

  it('exposes every field the account store getters and consumers depend on', async () => {
    mockRequestByUrl({
      'account/info': {
        data: {
          id: 1,
          kind: 'client',
          status: 'ONLINE',
          client_flags: ['allow_console'],
          first_login: false
        }
      },
      'user/me': {
        data: {
          id: 9,
          client_id: 'client-9',
          is_account_owner: true,
          email: 'e@acme.com',
          first_name: 'first',
          last_name: 'last',
          timezone: 'UTC',
          utc_offset: '+0000',
          permissions: [{ name: 'View Data Stream' }]
        }
      },
      'v4/iam/account': { data: { data: { job_function: 'other' } } }
    })

    const identity = await accountService.fetchAccountIdentity()

    const requiredKeys = [
      'id',
      'kind',
      'status',
      'client_flags',
      'first_login',
      'client_id',
      'is_account_owner',
      'permissions',
      'user_id',
      'email',
      'first_name',
      'last_name',
      'timezone',
      'utc_offset',
      'jobRole',
      'accountTypeIcon',
      'accountTypeName',
      'isDeveloperSupportPlan'
    ]

    for (const key of requiredKeys) {
      expect(identity, `identity must expose "${key}"`).toHaveProperty(key)
    }
  })
})

describe('getAccountIdentity — hardened query (ENG-46685)', () => {
  it('reads account.info with persistence disabled and staleTime 0 so no stale account survives a switch', async () => {
    const ensureSpy = vi.spyOn(accountService, 'useEnsureQueryData').mockResolvedValue({ id: 1 })

    await accountService.getAccountIdentity()

    expect(ensureSpy).toHaveBeenCalledWith(queryKeys.account.info(), expect.any(Function), {
      persist: false,
      staleTime: 0
    })
  })
})
