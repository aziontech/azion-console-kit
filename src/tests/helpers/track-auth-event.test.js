import { beforeEach, describe, expect, it, vi } from 'vitest'
import { trackSignInSafely } from '@/helpers/track-auth-event'
import { useAccountStore } from '@/stores/account'

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

  it('builds the payload from the token verification data', async () => {
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

  it('falls back to the hydrated store when no token data is provided', async () => {
    const { tracker, track, userSignedIn } = makeTracker()

    useAccountStore.mockReturnValue({
      getSignupTypeFlags: vi.fn(() => ({ login_sso_google: true })),
      accountData: {
        id: 456,
        kind: 'client',
        email: 'jane.doe@example.com',
        first_name: 'Jane',
        last_name: 'Doe',
        company_name: 'Azion'
      },
      isClientAccount: true,
      userId: 123
    })

    await trackSignInSafely({
      tracker,
      method: 'google'
    })

    expect(userSignedIn).toHaveBeenCalledWith({
      method: 'google',
      signupTypeFlags: { login_sso_google: true },
      email: 'jane.doe@example.com',
      userId: 123,
      accountId: 456,
      firstname: 'Jane',
      lastname: 'Doe',
      company: 'Azion',
      accountKind: 'client'
    })
    expect(track).toHaveBeenCalledTimes(1)
  })

  it('still fires the event without crashing when the token payload is malformed', async () => {
    const { tracker, track, userSignedIn } = makeTracker()

    await trackSignInSafely({
      tracker,
      method: 'email',
      email: 'typed@example.com',
      userTrackingInfo: { id: 'user-123' }
    })

    expect(userSignedIn).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'typed@example.com',
        userId: undefined,
        accountId: undefined,
        company: undefined
      })
    )
    expect(track).toHaveBeenCalledTimes(1)
  })
})
