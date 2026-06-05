import { beforeEach, describe, expect, it, vi } from 'vitest'
import { loadAccountHydration } from '@/helpers/account-data'
import {
  accountService,
  userService,
  accountSettingsService,
  contractService
} from '@/services/v2/account'
import { useAccountStore } from '@/stores/account'
import { setFeatureFlags } from '@/composables/user-flag'

vi.mock('@/services/v2/account', () => ({
  accountService: {
    getAccountInfo: vi.fn()
  },
  userService: {
    getUserInfo: vi.fn()
  },
  accountSettingsService: {
    getAccountSettingsInfo: vi.fn()
  },
  contractService: {
    getContractServicePlan: vi.fn()
  }
}))

vi.mock('@/stores/account', () => ({
  useAccountStore: vi.fn()
}))

vi.mock('@/composables/user-flag', () => ({
  setFeatureFlags: vi.fn()
}))

describe('account data hydration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    const accountStore = {
      account: {},
      setAccountData: vi.fn((accountData) => {
        accountStore.account = { ...accountStore.account, ...accountData }
      })
    }
    useAccountStore.mockReturnValue(accountStore)
    accountService.getAccountInfo.mockResolvedValue({
      id: 1,
      client_flags: [],
      has_service_order_plan: true
    })
    userService.getUserInfo.mockResolvedValue({ results: { id: 10, client_id: 20 } })
    accountSettingsService.getAccountSettingsInfo.mockResolvedValue({ jobRole: 'developer' })
    contractService.getContractServicePlan.mockResolvedValue({
      isDeveloperSupportPlan: true,
      yourServicePlan: 'Developer'
    })
  })

  it('hydrates account identity without loading contract data in the login guard path', async () => {
    await loadAccountHydration()

    expect(accountService.getAccountInfo).toHaveBeenCalledTimes(1)
    expect(userService.getUserInfo).toHaveBeenCalledTimes(1)
    expect(accountSettingsService.getAccountSettingsInfo).toHaveBeenCalledTimes(1)
    expect(contractService.getContractServicePlan).not.toHaveBeenCalled()
    expect(setFeatureFlags).toHaveBeenCalledWith([])
  })

  it('stores service order plan state from account info during login hydration', async () => {
    await loadAccountHydration()

    expect(useAccountStore().account.has_service_order_plan).toBe(true)
  })

  it('stores false when account info requires plan configuration', async () => {
    accountService.getAccountInfo.mockResolvedValueOnce({
      id: 1,
      client_flags: [],
      has_service_order_plan: false
    })

    await loadAccountHydration()

    expect(useAccountStore().account.has_service_order_plan).toBe(false)
  })

  it('stores normalized false from account service for non-active plan state', async () => {
    accountService.getAccountInfo.mockResolvedValueOnce({
      id: 1,
      client_flags: [],
      has_service_order_plan: false
    })

    await loadAccountHydration()

    expect(useAccountStore().account.has_service_order_plan).toBe(false)
  })
})
