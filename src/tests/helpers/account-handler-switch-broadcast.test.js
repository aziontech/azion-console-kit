import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AccountHandler } from '@/helpers/account-handler'
import { useAccountStore } from '@/stores/account'
import { sessionManager } from '@/services/v2/base/auth/sessionManager'

vi.mock('@/stores/account', () => ({
  useAccountStore: vi.fn()
}))

vi.mock('@/services/v2/base/auth/sessionManager', () => ({
  sessionManager: {
    switchAccount: vi.fn().mockResolvedValue(undefined),
    notifySwitchAccountComplete: vi.fn()
  }
}))

describe('AccountHandler switch-account broadcast contract', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAccountStore.mockReturnValue({ setHasSession: vi.fn() })
  })

  describe('switchAndReturnAccountPage', () => {
    it('notifies other tabs after the switch API succeeds', async () => {
      const switchAccountService = vi.fn().mockResolvedValue({ firstLogin: false })
      const handler = new AccountHandler(switchAccountService, vi.fn())

      await handler.switchAndReturnAccountPage('123')

      expect(sessionManager.notifySwitchAccountComplete).toHaveBeenCalledTimes(1)
    })

    it('does not notify other tabs when the switch API fails', async () => {
      const switchAccountService = vi.fn().mockRejectedValue(new Error('api fail'))
      const handler = new AccountHandler(switchAccountService, vi.fn())

      await expect(handler.switchAndReturnAccountPage('123')).rejects.toThrow('api fail')

      expect(sessionManager.notifySwitchAccountComplete).not.toHaveBeenCalled()
    })

    it('runs switchAccount before the API, and the API before notify', async () => {
      const switchAccountService = vi.fn().mockResolvedValue({ firstLogin: false })
      const handler = new AccountHandler(switchAccountService, vi.fn())

      await handler.switchAndReturnAccountPage('123')

      const prepareOrder = sessionManager.switchAccount.mock.invocationCallOrder[0]
      const apiOrder = switchAccountService.mock.invocationCallOrder[0]
      const notifyOrder = sessionManager.notifySwitchAccountComplete.mock.invocationCallOrder[0]

      expect(prepareOrder).toBeLessThan(apiOrder)
      expect(apiOrder).toBeLessThan(notifyOrder)
    })
  })

  describe('switchAccountAndRedirect', () => {
    beforeEach(() => {
      delete window.location
      window.location = { replace: vi.fn() }
    })

    it('notifies other tabs after the switch API succeeds', async () => {
      const switchAccountService = vi.fn().mockResolvedValue({ firstLogin: false })
      const handler = new AccountHandler(switchAccountService, vi.fn())

      await handler.switchAccountAndRedirect('456')

      expect(sessionManager.notifySwitchAccountComplete).toHaveBeenCalledTimes(1)
    })

    it('does not notify other tabs when the switch API fails', async () => {
      const switchAccountService = vi.fn().mockRejectedValue(new Error('api fail'))
      const handler = new AccountHandler(switchAccountService, vi.fn())

      await expect(handler.switchAccountAndRedirect('456')).rejects.toThrow('api fail')

      expect(sessionManager.notifySwitchAccountComplete).not.toHaveBeenCalled()
    })

    it('runs switchAccount before the API, and the API before notify', async () => {
      const switchAccountService = vi.fn().mockResolvedValue({ firstLogin: false })
      const handler = new AccountHandler(switchAccountService, vi.fn())

      await handler.switchAccountAndRedirect('456')

      const prepareOrder = sessionManager.switchAccount.mock.invocationCallOrder[0]
      const apiOrder = switchAccountService.mock.invocationCallOrder[0]
      const notifyOrder = sessionManager.notifySwitchAccountComplete.mock.invocationCallOrder[0]

      expect(prepareOrder).toBeLessThan(apiOrder)
      expect(apiOrder).toBeLessThan(notifyOrder)
    })
  })

  describe('switchAccountFromSocialIdp', () => {
    it('does not touch session state when verify returns no userInfo', async () => {
      const verifyService = vi.fn().mockResolvedValue({ user_tracking_info: null })
      const handler = new AccountHandler(vi.fn(), vi.fn())

      const result = await handler.switchAccountFromSocialIdp(verifyService, vi.fn(), false)

      expect(sessionManager.switchAccount).not.toHaveBeenCalled()
      expect(sessionManager.notifySwitchAccountComplete).not.toHaveBeenCalled()
      expect(result).toBe('/login')
    })

    it('does not touch session state when redirecting to MFA', async () => {
      const verifyService = vi.fn().mockResolvedValue({
        twoFactor: true,
        trustedDevice: false,
        user_tracking_info: { props: {} }
      })
      const handler = new AccountHandler(vi.fn(), vi.fn())

      const result = await handler.switchAccountFromSocialIdp(verifyService, vi.fn(), false)

      expect(sessionManager.switchAccount).not.toHaveBeenCalled()
      expect(sessionManager.notifySwitchAccountComplete).not.toHaveBeenCalled()
      expect(result).toBe('/mfa/setup')
    })
  })
})
