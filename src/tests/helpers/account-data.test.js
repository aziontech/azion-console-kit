import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/services/v2/account', () => ({
  accountService: { getAccountIdentity: vi.fn() },
  contractService: {}
}))
vi.mock('@/services/v2/base/query/queryClient', () => ({
  queryClient: { removeQueries: vi.fn() }
}))
vi.mock('@/composables/user-flag', () => ({
  setFeatureFlags: vi.fn()
}))
vi.mock('@/stores/account', () => ({
  useAccountStore: vi.fn()
}))

import { loadUserAndAccountInfo } from '@/helpers/account-data'
import { accountService } from '@/services/v2/account'
import { setFeatureFlags } from '@/composables/user-flag'
import { useAccountStore } from '@/stores/account'

describe('loadUserAndAccountInfo', () => {
  let setIdentity
  let setAccountData

  beforeEach(() => {
    vi.clearAllMocks()
    setIdentity = vi.fn()
    setAccountData = vi.fn()
    useAccountStore.mockReturnValue({ setIdentity, setAccountData })
  })

  it('reads the single identity source and writes it into the store via setIdentity', async () => {
    const identity = {
      id: 42,
      kind: 'client',
      client_id: 'client-42',
      client_flags: ['allow_console']
    }
    accountService.getAccountIdentity.mockResolvedValue(identity)

    await loadUserAndAccountInfo()

    expect(accountService.getAccountIdentity).toHaveBeenCalledTimes(1)
    expect(setIdentity).toHaveBeenCalledWith(identity)
  })

  it('feeds feature flags from the identity payload', async () => {
    accountService.getAccountIdentity.mockResolvedValue({ client_flags: ['flag_a', 'flag_b'] })

    await loadUserAndAccountInfo()

    expect(setFeatureFlags).toHaveBeenCalledWith(['flag_a', 'flag_b'])
  })

  it('clears billing-derived fields before reloading when force is set', async () => {
    accountService.getAccountIdentity.mockResolvedValue({ client_flags: [] })

    await loadUserAndAccountInfo({ force: true })

    expect(setAccountData).toHaveBeenCalledWith(
      expect.objectContaining({
        credit: undefined,
        formatCredit: undefined,
        days: undefined,
        yourServicePlan: undefined,
        isDeveloperSupportPlan: undefined
      })
    )
    expect(setIdentity).toHaveBeenCalled()
  })
})
