import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AccountService, accountService } from '@/services/v2/account/account-service'
import { httpService } from '@/services/v2/base/http/httpService'
import { queryKeys } from '@/services/v2/base/query/queryKeys'

vi.mock('@/services/v2/base/http/httpService')

describe('AccountService._adaptAccountInfo', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_BILLING_TYPE', '')
    vi.stubEnv('VITE_BILLING_TYPE_OVERRIDE', '')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    localStorage.clear()
  })

  it('passes through the backend billing_type value', () => {
    const service = new AccountService()

    const result = service._adaptAccountInfo({
      id: 1,
      kind: 'client',
      billing_type: 'plan'
    })

    expect(result.billing_type).toBe('plan')
  })

  it('normalizes a missing billing_type to null', () => {
    const service = new AccountService()

    const result = service._adaptAccountInfo({
      id: 1,
      kind: 'client'
    })

    expect(result.billing_type).toBeNull()
  })

  it('forces billing_type to null when the override is set to null', () => {
    vi.stubEnv('VITE_BILLING_TYPE_OVERRIDE', 'null')
    const service = new AccountService()

    const result = service._adaptAccountInfo({
      id: 1,
      kind: 'client',
      billing_type: 'plan'
    })

    expect(result.billing_type).toBeNull()
  })

  it('forces billing_type to the override value when set', () => {
    vi.stubEnv('VITE_BILLING_TYPE_OVERRIDE', 'custom')
    const service = new AccountService()

    const result = service._adaptAccountInfo({
      id: 1,
      kind: 'client',
      billing_type: null
    })

    expect(result.billing_type).toBe('custom')
  })

  it('falls back to the localStorage override when the env override is not set', () => {
    localStorage.setItem('billing_type_override', 'custom')
    const service = new AccountService()

    const result = service._adaptAccountInfo({
      id: 1,
      kind: 'client',
      billing_type: 'plan'
    })

    expect(result.billing_type).toBe('custom')
  })

  it('forces billing_type to null when the localStorage override is set to null', () => {
    localStorage.setItem('billing_type_override', 'null')
    const service = new AccountService()

    const result = service._adaptAccountInfo({
      id: 1,
      kind: 'client',
      billing_type: 'plan'
    })

    expect(result.billing_type).toBeNull()
  })

  it('prefers the env configuration over the localStorage one', () => {
    vi.stubEnv('VITE_BILLING_TYPE_OVERRIDE', 'internal')
    localStorage.setItem('billing_type_override', 'custom')
    const service = new AccountService()

    const result = service._adaptAccountInfo({
      id: 1,
      kind: 'client',
      billing_type: 'plan'
    })

    expect(result.billing_type).toBe('internal')
  })

  it('ignores a configured value outside plan/internal/custom/null', () => {
    vi.stubEnv('VITE_BILLING_TYPE_OVERRIDE', 'something-new')
    const service = new AccountService()

    const result = service._adaptAccountInfo({
      id: 1,
      kind: 'client',
      billing_type: 'custom'
    })

    expect(result.billing_type).toBe('custom')
  })

  it('reads the billing type from VITE_BILLING_TYPE as well', () => {
    vi.stubEnv('VITE_BILLING_TYPE', 'custom')
    const service = new AccountService()

    const result = service._adaptAccountInfo({
      id: 1,
      kind: 'client',
      billing_type: 'plan'
    })

    expect(result.billing_type).toBe('custom')
  })

  it('does not flag the backend value as overridden', () => {
    const service = new AccountService()

    const result = service._adaptAccountInfo({
      id: 1,
      kind: 'client',
      billing_type: 'plan'
    })

    expect(result.billing_type_overridden).toBe(false)
  })

  it('flags a configured billing_type as overridden', () => {
    vi.stubEnv('VITE_BILLING_TYPE_OVERRIDE', 'null')
    const service = new AccountService()

    const result = service._adaptAccountInfo({
      id: 1,
      kind: 'client',
      billing_type: 'custom'
    })

    expect(result.billing_type).toBeNull()
    expect(result.billing_type_overridden).toBe(true)
  })
})

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
