import { httpService } from '@/services/v2/base/http/httpService'
import { accountService } from '@/services/v2/account/account-service'
import { queryClient, clearAllCache } from '@/services/v2/base/query/queryClient'
import { queryKeys } from '@/services/v2/base/query/queryKeys'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/services/v2/base/http/httpService')

const responsesFor = (account) => ({
  'account/info': { data: account.info },
  'user/me': { data: account.user },
  'v4/iam/account': { data: { data: { job_function: account.jobFunction } } }
})

const mockAccount = (account) =>
  vi.spyOn(httpService, 'request').mockImplementation(({ url }) => {
    const map = responsesFor(account)
    if (url in map) return Promise.resolve(map[url])
    throw new Error(`unexpected request url: ${url}`)
  })

const ACCOUNT_A = {
  info: { id: 100, name: '7706t', kind: 'client', client_flags: [], status: 'ONLINE' },
  user: { id: 1, client_id: 'client-A', email: 'a@acme.com' },
  jobFunction: 'other'
}
const ACCOUNT_B = {
  info: { id: 200, name: 'other-client', kind: 'client', client_flags: [], status: 'ONLINE' },
  user: { id: 2, client_id: 'client-B', email: 'b@acme.com' },
  jobFunction: 'other'
}

describe('getAccountIdentity — real query layer (ENG-46685)', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    await clearAllCache()
  })

  afterEach(async () => {
    await clearAllCache()
  })

  it('fetches the identity through the query client and caches it', async () => {
    mockAccount(ACCOUNT_A)

    const identity = await accountService.getAccountIdentity()

    expect(identity.id).toBe(100)
    expect(identity.client_id).toBe('client-A')
    expect(queryClient.getQueryData(queryKeys.account.info())).toBeTruthy()
  })

  it('after the switch clears the cache, returns the NEW account, never the stale one', async () => {
    mockAccount(ACCOUNT_A)
    const first = await accountService.getAccountIdentity()
    expect(first.id).toBe(100)

    await clearAllCache()

    mockAccount(ACCOUNT_B)
    const second = await accountService.getAccountIdentity()

    expect(second.id).toBe(200)
    expect(second.name).toBe('other-client')
    expect(second.client_id).toBe('client-B')
    expect(second.email).toBe('b@acme.com')
  })
})
