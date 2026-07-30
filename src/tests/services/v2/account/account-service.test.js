import { httpService } from '@/services/v2/base/http/httpService'
import { accountService } from '@/services/v2/account/account-service'
import { queryKeys } from '@/services/v2/base/query/queryKeys'
import { describe, expect, it, vi, beforeEach } from 'vitest'

vi.mock('@/services/v2/base/http/httpService')

const mockRequestByUrl = (responsesByUrl) =>
  vi.spyOn(httpService, 'request').mockImplementation(({ url }) => {
    if (url in responsesByUrl) return Promise.resolve(responsesByUrl[url])
    throw new Error(`unexpected request url: ${url}`)
  })

describe('AccountService.fetchAccountIdentity', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

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

describe('AccountService.getAccountIdentity (hardened query)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('reads account.info with persistence disabled and staleTime 0 so no stale account survives a switch', async () => {
    const ensureSpy = vi.spyOn(accountService, 'useEnsureQueryData').mockResolvedValue({ id: 1 })

    await accountService.getAccountIdentity()

    expect(ensureSpy).toHaveBeenCalledWith(queryKeys.account.info(), expect.any(Function), {
      persist: false,
      staleTime: 0
    })
  })
})
