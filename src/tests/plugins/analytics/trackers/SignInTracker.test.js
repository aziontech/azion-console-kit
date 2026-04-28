import { SignInTracker } from '@/plugins/analytics/trackers/SignInTracker'
import { describe, expect, it, vi, beforeEach } from 'vitest'

vi.mock('@/services/hubspot-services', () => ({
  hubspotFormSubmitService: vi.fn()
}))

vi.mock('@/utils/cookies', () => ({
  getHubSpotUtk: vi.fn(),
  getHubSpotContext: vi.fn()
}))

const makeSut = () => {
  const trackerAdapterSpy = {
    addEvent: vi.fn().mockReturnThis()
  }
  const sut = new SignInTracker(trackerAdapterSpy)

  return {
    sut,
    trackerAdapterSpy
  }
}

describe('SignInTracker', () => {
  let hubspotFormSubmitService
  let getHubSpotUtk
  let getHubSpotContext

  beforeEach(async () => {
    vi.clearAllMocks()
    hubspotFormSubmitService = (await import('@/services/hubspot-services'))
      .hubspotFormSubmitService
    getHubSpotUtk = (await import('@/utils/cookies')).getHubSpotUtk
    getHubSpotContext = (await import('@/utils/cookies')).getHubSpotContext
    getHubSpotUtk.mockReturnValue(undefined)
    getHubSpotContext.mockReturnValue({})
  })

  describe('userSignedIn', () => {
    it('should add Segment event with correct event name and props', () => {
      const { sut, trackerAdapterSpy } = makeSut()

      sut.userSignedIn({
        method: 'email',
        signupTypeFlags: { login_email: true }
      })

      expect(trackerAdapterSpy.addEvent).toHaveBeenCalledWith({
        eventName: 'User Signed In',
        props: {
          method: 'email',
          login_sso_google: false,
          login_sso_github: false,
          login_email: true,
          signup_sso_google: false,
          signup_sso_github: false,
          signup_email: false
        }
      })
    })

    it('should call HubSpot form submission when email and userId are provided', async () => {
      const { sut } = makeSut()

      sut.userSignedIn({
        method: 'email',
        signupTypeFlags: { login_email: true },
        email: 'test@example.com',
        userId: 'user-123'
      })

      expect(hubspotFormSubmitService).toHaveBeenCalledWith({
        email: 'test@example.com',
        form_action: 'login_email',
        user_id__rtm_: 'user-123',
        firstname: undefined,
        lastname: undefined,
        mobilephone: undefined,
        company: undefined,
        github_handle: undefined,
        utk: undefined,
        context: {}
      })
    })

    it('should not call HubSpot when email is missing', () => {
      const { sut } = makeSut()

      sut.userSignedIn({
        method: 'email',
        userId: 'user-123',
        signupTypeFlags: { login_email: true }
      })

      expect(hubspotFormSubmitService).not.toHaveBeenCalled()
    })

    it('should not call HubSpot when userId is missing', () => {
      const { sut } = makeSut()

      sut.userSignedIn({
        method: 'email',
        email: 'test@example.com',
        signupTypeFlags: { login_email: true }
      })

      expect(hubspotFormSubmitService).not.toHaveBeenCalled()
    })

    it('should pass all optional fields to HubSpot when provided', async () => {
      const { sut } = makeSut()

      sut.userSignedIn({
        method: 'github',
        signupTypeFlags: { login_sso_github: true },
        email: 'test@example.com',
        userId: 'user-789',
        firstname: 'John',
        lastname: 'Doe',
        phone: '+1234567890',
        company: 'Acme Inc',
        githubHandle: 'johndoe'
      })

      expect(hubspotFormSubmitService).toHaveBeenCalledWith({
        email: 'test@example.com',
        form_action: 'login_sso_github',
        user_id__rtm_: 'user-789',
        firstname: 'John',
        lastname: 'Doe',
        mobilephone: '+1234567890',
        company: 'Acme Inc',
        github_handle: 'johndoe',
        utk: undefined,
        context: {}
      })
    })

    it('should use correct form_action for login_sso_google', async () => {
      const { sut } = makeSut()

      sut.userSignedIn({
        method: 'google',
        signupTypeFlags: { login_sso_google: true },
        email: 'test@example.com',
        userId: 'user-123'
      })

      expect(hubspotFormSubmitService).toHaveBeenCalledWith(
        expect.objectContaining({
          form_action: 'login_sso_google'
        })
      )
    })

    it('should use correct form_action for login_sso_github', async () => {
      const { sut } = makeSut()

      sut.userSignedIn({
        method: 'github',
        signupTypeFlags: { login_sso_github: true },
        email: 'test@example.com',
        userId: 'user-123'
      })

      expect(hubspotFormSubmitService).toHaveBeenCalledWith(
        expect.objectContaining({
          form_action: 'login_sso_github'
        })
      )
    })

    it('should use correct form_action for login_email', async () => {
      const { sut } = makeSut()

      sut.userSignedIn({
        method: 'email',
        signupTypeFlags: { login_email: true },
        email: 'test@example.com',
        userId: 'user-123'
      })

      expect(hubspotFormSubmitService).toHaveBeenCalledWith(
        expect.objectContaining({
          form_action: 'login_email'
        })
      )
    })

    it('should default to login_email when no signupTypeFlags provided', async () => {
      const { sut } = makeSut()

      sut.userSignedIn({
        method: 'email',
        email: 'test@example.com',
        userId: 'user-123'
      })

      expect(hubspotFormSubmitService).toHaveBeenCalledWith(
        expect.objectContaining({
          form_action: 'login_email'
        })
      )
    })

    it('should return trackerAdapter for chaining', () => {
      const { sut, trackerAdapterSpy } = makeSut()

      const result = sut.userSignedIn({
        method: 'email',
        signupTypeFlags: { login_email: true }
      })

      expect(result).toBe(trackerAdapterSpy)
    })

    it('should pass hubspotutk cookie value to HubSpot when available', async () => {
      const { sut } = makeSut()
      getHubSpotUtk.mockReturnValue('hubspot-token-from-cookie')

      sut.userSignedIn({
        method: 'email',
        signupTypeFlags: { login_email: true },
        email: 'test@example.com',
        userId: 'user-123'
      })

      expect(hubspotFormSubmitService).toHaveBeenCalledWith(
        expect.objectContaining({
          utk: 'hubspot-token-from-cookie'
        })
      )
    })

    it('should pass null utk when hubspotutk cookie is not present', async () => {
      const { sut } = makeSut()
      getHubSpotUtk.mockReturnValue(null)

      sut.userSignedIn({
        method: 'email',
        signupTypeFlags: { login_email: true },
        email: 'test@example.com',
        userId: 'user-123'
      })

      expect(hubspotFormSubmitService).toHaveBeenCalledWith(
        expect.objectContaining({
          utk: null
        })
      )
    })
  })

  describe('userClickedSignIn', () => {
    it('should add Segment event with correct event name', () => {
      const { sut, trackerAdapterSpy } = makeSut()

      sut.userClickedSignIn({ method: 'email' })

      expect(trackerAdapterSpy.addEvent).toHaveBeenCalledWith({
        eventName: 'User Clicked to Sign In',
        props: {
          method: 'email'
        }
      })
    })

    it('should return trackerAdapter for chaining', () => {
      const { sut, trackerAdapterSpy } = makeSut()

      const result = sut.userClickedSignIn({ method: 'google' })

      expect(result).toBe(trackerAdapterSpy)
    })
  })

  describe('userFailedSignIn', () => {
    it('should add Segment event with error details', () => {
      const { sut, trackerAdapterSpy } = makeSut()

      sut.userFailedSignIn({
        method: 'email',
        signupTypeFlags: { login_email: true }
      })

      expect(trackerAdapterSpy.addEvent).toHaveBeenCalledWith({
        eventName: 'User Failed to Sign In',
        props: {
          method: 'email',
          login_sso_google: false,
          login_sso_github: false,
          login_email: true,
          signup_sso_google: false,
          signup_sso_github: false,
          signup_email: false
        }
      })
    })

    it('should not call HubSpot', () => {
      const { sut } = makeSut()

      sut.userFailedSignIn({
        method: 'email',
        signupTypeFlags: { login_email: true }
      })

      expect(hubspotFormSubmitService).not.toHaveBeenCalled()
    })

    it('should return trackerAdapter for chaining', () => {
      const { sut, trackerAdapterSpy } = makeSut()

      const result = sut.userFailedSignIn({
        method: 'email',
        signupTypeFlags: { login_email: true }
      })

      expect(result).toBe(trackerAdapterSpy)
    })
  })
})
