import { beforeEach, describe, expect, it, vi } from 'vitest'
import { trackSignInSafely } from '@/helpers/track-auth-event'
import { loadUserAndAccountInfo } from '@/helpers/account-data'
import { useAccountStore } from '@/stores/account'

vi.mock('@/helpers/account-data', () => ({
  loadUserAndAccountInfo: vi.fn()
}))

vi.mock('@/stores/account', () => ({
  useAccountStore: vi.fn()
}))

const makeTracker = () => {
  const track = vi.fn()
  const userSignedIn = vi.fn(() => ({ track }))

  return {
    tracker: {
      signIn: {
        userSignedIn
      }
    },
    track,
    userSignedIn
  }
}

describe('trackSignInSafely', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAccountStore.mockReturnValue({
      getSignupTypeFlags: vi.fn(() => ({ login_email: true })),
      accountData: {},
      isClientAccount: false,
      userId: undefined
    })
  })

  it('uses token verification tracking data without hydrating account data', async () => {
    const { tracker, track, userSignedIn } = makeTracker()

    await trackSignInSafely({
      tracker,
      method: 'email',
      userTrackingInfo: {
        id: 'user-123',
        props: {
          account_company_name: 'Azion',
          account_id: 'account-456',
          account_type: 'client',
          email: 'john.doe@example.com',
          full_name: 'John Doe'
        }
      }
    })

    expect(loadUserAndAccountInfo).not.toHaveBeenCalled()
    expect(userSignedIn).toHaveBeenCalledWith({
      method: 'email',
      signupTypeFlags: { login_email: true },
      email: 'john.doe@example.com',
      userId: 'user-123',
      accountId: 'account-456',
      firstname: 'John',
      lastname: 'Doe',
      company: 'Azion',
      accountKind: 'client'
    })
    expect(track).toHaveBeenCalledTimes(1)
  })
})
