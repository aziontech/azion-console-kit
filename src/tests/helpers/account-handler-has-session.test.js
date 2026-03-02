import { describe, expect, it, vi } from 'vitest'
import { AccountHandler } from '@/helpers/account-handler'
import { useAccountStore } from '@/stores/account'

vi.mock('@/stores/account', () => ({
  useAccountStore: vi.fn()
}))

vi.mock('@/services/v2/base/auth/sessionManager', () => ({
  sessionManager: {
    switchAccount: vi.fn().mockResolvedValue(undefined)
  }
}))

describe('AccountHandler hasSession flag', () => {
  it('should set hasSession=true after successful switchAndReturnAccountPage', async () => {
    const setHasSession = vi.fn()
    useAccountStore.mockReturnValue({ setHasSession })

    const switchAccountService = vi.fn().mockResolvedValue({ firstLogin: false })
    const listTypeAccountService = vi.fn()
    const handler = new AccountHandler(switchAccountService, listTypeAccountService)

    await handler.switchAndReturnAccountPage('123')

    expect(setHasSession).toHaveBeenCalledWith(true)
  })

  it('should set hasSession=true after successful switchAccountAndRedirect', async () => {
    const setHasSession = vi.fn()
    useAccountStore.mockReturnValue({ setHasSession })

    const switchAccountService = vi.fn().mockResolvedValue({ firstLogin: false })
    const listTypeAccountService = vi.fn()
    const handler = new AccountHandler(switchAccountService, listTypeAccountService)

    delete window.location
    window.location = { replace: vi.fn() }

    await handler.switchAccountAndRedirect('456')

    expect(setHasSession).toHaveBeenCalledWith(true)
  })
})
