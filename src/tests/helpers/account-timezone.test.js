import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getCurrentTimezone } from '@/helpers'
import { setActivePinia, createPinia } from 'pinia'
import { useAccountStore } from '@stores/account'

vi.mock('@stores/account', () => ({
  useAccountStore: vi.fn()
}))

describe('getCurrentTimezone', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('should format the date correctly according to user timezone', () => {
    const mockAccountStore = {
      accountData: { timezone: 'America/New_York' }
    }
    useAccountStore.mockReturnValue(mockAccountStore)

    const time = '2025-03-17T12:00:00Z'
    const formattedTime = getCurrentTimezone(time)

    expect(formattedTime).toBeTruthy()
    expect(formattedTime).toMatch(/\d{2}:\d{2}:\d{2}/) // Checa se contém horário
  })
})
