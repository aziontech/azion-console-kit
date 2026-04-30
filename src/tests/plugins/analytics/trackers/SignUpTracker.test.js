import { SignUpTracker } from '@/plugins/analytics/trackers/SignUpTracker'
import { describe, expect, it, vi, beforeEach } from 'vitest'

vi.mock('@/services/v2/hubspot', () => ({
  hubspotService: {
    submitForm: vi.fn()
  }
}))

vi.mock('@/utils/cookies', () => ({
  getHubSpotUtk: vi.fn(),
  getHubSpotContext: vi.fn()
}))

const makeSut = () => {
  const trackerAdapterSpy = {
    addEvent: vi.fn().mockReturnThis()
  }
  const sut = new SignUpTracker(trackerAdapterSpy)

  return {
    sut,
    trackerAdapterSpy
  }
}

describe('SignUpTracker', () => {
  let hubspotService
  let getHubSpotUtk
  let getHubSpotContext

  beforeEach(async () => {
    vi.clearAllMocks()
    hubspotService = (await import('@/services/v2/hubspot')).hubspotService
    getHubSpotUtk = (await import('@/utils/cookies')).getHubSpotUtk
    getHubSpotContext = (await import('@/utils/cookies')).getHubSpotContext
    getHubSpotUtk.mockReturnValue(undefined)
    getHubSpotContext.mockReturnValue({})
  })

  describe('userSignedUp', () => {
    it('should add Segment event with correct event name and props', () => {
      const { sut, trackerAdapterSpy } = makeSut()

      sut.userSignedUp({
        method: 'email',
        firstSessionUrl: 'https://console.azion.com/signup?ref=docs',
        signupTypeFlags: { signup_email: true }
      })

      expect(trackerAdapterSpy.addEvent).toHaveBeenCalledWith({
        eventName: 'User Signed Up',
        props: {
          method: 'email',
          first_session_url: 'https://console.azion.com/signup?ref=docs',
          signup_type: 'signup_email',
          login_sso_google: false,
          login_sso_github: false,
          login_email: false,
          signup_sso_google: false,
          signup_sso_github: false,
          signup_email: true
        }
      })
    })

    it('should call HubSpot form submission when email and userId are provided', async () => {
      const { sut } = makeSut()

      sut.userSignedUp({
        method: 'email',
        firstSessionUrl: 'https://console.azion.com/signup',
        signupTypeFlags: { signup_email: true },
        email: 'test@example.com',
        userId: 'user-123'
      })

      expect(hubspotService.submitForm).toHaveBeenCalledWith({
        email: 'test@example.com',
        form_action: 'signup_email',
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

      sut.userSignedUp({
        method: 'email',
        userId: 'user-123',
        signupTypeFlags: { signup_email: true }
      })

      expect(hubspotService.submitForm).not.toHaveBeenCalled()
    })

    it('should not call HubSpot when userId is missing', () => {
      const { sut } = makeSut()

      sut.userSignedUp({
        method: 'email',
        email: 'test@example.com',
        signupTypeFlags: { signup_email: true }
      })

      expect(hubspotService.submitForm).not.toHaveBeenCalled()
    })

    it('should pass all optional fields to HubSpot when provided', async () => {
      const { sut } = makeSut()

      sut.userSignedUp({
        method: 'github',
        firstSessionUrl: 'https://console.azion.com/signup',
        signupTypeFlags: { signup_sso_github: true },
        email: 'test@example.com',
        userId: 'user-789',
        firstname: 'John',
        lastname: 'Doe',
        phone: '+1234567890',
        company: 'Acme Inc',
        githubHandle: 'johndoe'
      })

      expect(hubspotService.submitForm).toHaveBeenCalledWith({
        email: 'test@example.com',
        form_action: 'signup_sso_github',
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

    it('should use correct form_action for signup_sso_google', async () => {
      const { sut } = makeSut()

      sut.userSignedUp({
        method: 'google',
        signupTypeFlags: { signup_sso_google: true },
        email: 'test@example.com',
        userId: 'user-123'
      })

      expect(hubspotService.submitForm).toHaveBeenCalledWith(
        expect.objectContaining({
          form_action: 'signup_sso_google'
        })
      )
    })

    it('should use correct form_action for signup_sso_github', async () => {
      const { sut } = makeSut()

      sut.userSignedUp({
        method: 'github',
        signupTypeFlags: { signup_sso_github: true },
        email: 'test@example.com',
        userId: 'user-123'
      })

      expect(hubspotService.submitForm).toHaveBeenCalledWith(
        expect.objectContaining({
          form_action: 'signup_sso_github'
        })
      )
    })

    it('should use correct form_action for login_email', async () => {
      const { sut } = makeSut()

      sut.userSignedUp({
        method: 'email',
        signupTypeFlags: { login_email: true },
        email: 'test@example.com',
        userId: 'user-123'
      })

      expect(hubspotService.submitForm).toHaveBeenCalledWith(
        expect.objectContaining({
          form_action: 'login_email'
        })
      )
    })

    it('should use correct form_action for login_sso_google', async () => {
      const { sut } = makeSut()

      sut.userSignedUp({
        method: 'google',
        signupTypeFlags: { login_sso_google: true },
        email: 'test@example.com',
        userId: 'user-123'
      })

      expect(hubspotService.submitForm).toHaveBeenCalledWith(
        expect.objectContaining({
          form_action: 'login_sso_google'
        })
      )
    })

    it('should use correct form_action for login_sso_github', async () => {
      const { sut } = makeSut()

      sut.userSignedUp({
        method: 'github',
        signupTypeFlags: { login_sso_github: true },
        email: 'test@example.com',
        userId: 'user-123'
      })

      expect(hubspotService.submitForm).toHaveBeenCalledWith(
        expect.objectContaining({
          form_action: 'login_sso_github'
        })
      )
    })

    it('should default to signup_email when no signupTypeFlags provided', async () => {
      const { sut } = makeSut()

      sut.userSignedUp({
        method: 'email',
        email: 'test@example.com',
        userId: 'user-123'
      })

      expect(hubspotService.submitForm).toHaveBeenCalledWith(
        expect.objectContaining({
          form_action: 'signup_email'
        })
      )
    })

    it('should return trackerAdapter for chaining', () => {
      const { sut, trackerAdapterSpy } = makeSut()

      const result = sut.userSignedUp({
        method: 'email',
        signupTypeFlags: { signup_email: true }
      })

      expect(result).toBe(trackerAdapterSpy)
    })
  })

  describe('userClickedSignedUp', () => {
    it('should add Segment event with correct event name', () => {
      const { sut, trackerAdapterSpy } = makeSut()

      sut.userClickedSignedUp({ method: 'email' })

      expect(trackerAdapterSpy.addEvent).toHaveBeenCalledWith({
        eventName: 'User Clicked to Sign Up',
        props: {
          method: 'email'
        }
      })
    })

    it('should return trackerAdapter for chaining', () => {
      const { sut, trackerAdapterSpy } = makeSut()

      const result = sut.userClickedSignedUp({ method: 'google' })

      expect(result).toBe(trackerAdapterSpy)
    })
  })

  describe('userAuthorizedSso', () => {
    it('should add Segment event with correct event name and props', () => {
      const { sut, trackerAdapterSpy } = makeSut()

      sut.userAuthorizedSso({
        method: 'google',
        firstSessionUrl: 'https://console.azion.com/signup',
        signupTypeFlags: { signup_sso_google: true }
      })

      expect(trackerAdapterSpy.addEvent).toHaveBeenCalledWith({
        eventName: 'User Authorized SSO',
        props: {
          method: 'google',
          first_session_url: 'https://console.azion.com/signup',
          signup_type: 'signup_sso_google',
          login_sso_google: false,
          login_sso_github: false,
          login_email: false,
          signup_sso_google: true,
          signup_sso_github: false,
          signup_email: false
        }
      })
    })

    it('should not call HubSpot (only Segment event)', () => {
      const { sut } = makeSut()

      sut.userAuthorizedSso({
        method: 'github',
        signupTypeFlags: { signup_sso_github: true },
        email: 'test@example.com',
        userId: 'user-123'
      })

      // HubSpot should only be called by userSignedUp, not userAuthorizedSso
      expect(hubspotService.submitForm).not.toHaveBeenCalled()
    })

    it('should return trackerAdapter for chaining', () => {
      const { sut, trackerAdapterSpy } = makeSut()

      const result = sut.userAuthorizedSso({ method: 'github' })

      expect(result).toBe(trackerAdapterSpy)
    })
  })

  describe('userFailedSignUp', () => {
    it('should add Segment event with error details', () => {
      const { sut, trackerAdapterSpy } = makeSut()

      sut.userFailedSignUp({
        errorType: 'api',
        fieldName: 'email',
        errorMessage: 'Invalid email format'
      })

      expect(trackerAdapterSpy.addEvent).toHaveBeenCalledWith({
        eventName: 'User Failed to Sign Up',
        props: {
          errorType: 'api',
          fieldName: 'email',
          errorMessage: 'Invalid email format'
        }
      })
    })

    it('should not call HubSpot', () => {
      const { sut } = makeSut()

      sut.userFailedSignUp({
        errorType: 'field',
        fieldName: 'password',
        errorMessage: 'Password too short'
      })

      expect(hubspotService.submitForm).not.toHaveBeenCalled()
    })

    it('should return trackerAdapter for chaining', () => {
      const { sut, trackerAdapterSpy } = makeSut()

      const result = sut.userFailedSignUp({
        errorType: 'api',
        fieldName: 'email',
        errorMessage: 'Error'
      })

      expect(result).toBe(trackerAdapterSpy)
    })
  })

  describe('submittedAdditionalData', () => {
    it('should add Segment event with additional data', () => {
      const { sut, trackerAdapterSpy } = makeSut()

      sut.submittedAdditionalData({
        use: 'Personal projects',
        role: 'Developer',
        inputRole: 'Senior Dev',
        companySize: '1-10',
        onboardingSession: 'scheduled',
        companyWebsite: 'https://example.com',
        fullName: 'John Doe'
      })

      expect(trackerAdapterSpy.addEvent).toHaveBeenCalledWith({
        eventName: 'Submitted Additional Data',
        props: {
          use: 'Personal projects',
          role: 'Developer',
          inputRole: 'Senior Dev',
          companySize: '1-10',
          onboardingSchedule: 'scheduled',
          website: 'https://example.com',
          name: 'John Doe'
        }
      })
    })

    it('should return trackerAdapter for chaining', () => {
      const { sut, trackerAdapterSpy } = makeSut()

      const result = sut.submittedAdditionalData({})

      expect(result).toBe(trackerAdapterSpy)
    })
  })

  describe('failedSubmitAdditionalData', () => {
    it('should add Segment event with error details', () => {
      const { sut, trackerAdapterSpy } = makeSut()

      sut.failedSubmitAdditionalData({
        errorType: 'validation',
        errorMessage: 'Field required',
        fieldName: 'company'
      })

      expect(trackerAdapterSpy.addEvent).toHaveBeenCalledWith({
        eventName: 'Failed to Submit Additional Data',
        props: {
          errorType: 'validation',
          errorMessage: 'Field required',
          fieldName: 'company'
        }
      })
    })

    it('should return trackerAdapter for chaining', () => {
      const { sut, trackerAdapterSpy } = makeSut()

      const result = sut.failedSubmitAdditionalData({
        errorType: 'api',
        errorMessage: 'Error',
        fieldName: 'role'
      })

      expect(result).toBe(trackerAdapterSpy)
    })
  })

  describe('userActivatedAccount', () => {
    it('should add Segment event', () => {
      const { sut, trackerAdapterSpy } = makeSut()

      sut.userActivatedAccount()

      expect(trackerAdapterSpy.addEvent).toHaveBeenCalledWith({
        eventName: 'User Activated Account',
        props: {}
      })
    })

    it('should return trackerAdapter for chaining', () => {
      const { sut, trackerAdapterSpy } = makeSut()

      const result = sut.userActivatedAccount()

      expect(result).toBe(trackerAdapterSpy)
    })
  })

  describe('HubSpot UTK cookie', () => {
    it('should pass utk to HubSpot when hubspotutk cookie exists', async () => {
      const { sut } = makeSut()
      const { getHubSpotUtk } = await import('@/utils/cookies')
      getHubSpotUtk.mockReturnValue('hubspot-token-from-cookie')

      sut.userSignedUp({
        method: 'email',
        signupTypeFlags: { signup_email: true },
        email: 'test@example.com',
        userId: 'user-123'
      })

      expect(hubspotService.submitForm).toHaveBeenCalledWith(
        expect.objectContaining({
          utk: 'hubspot-token-from-cookie'
        })
      )
    })

    it('should pass null utk when hubspotutk cookie does not exist', async () => {
      const { sut } = makeSut()
      const { getHubSpotUtk } = await import('@/utils/cookies')
      getHubSpotUtk.mockReturnValue(null)

      sut.userSignedUp({
        method: 'email',
        signupTypeFlags: { signup_email: true },
        email: 'test@example.com',
        userId: 'user-123'
      })

      expect(hubspotService.submitForm).toHaveBeenCalledWith(
        expect.objectContaining({
          utk: null
        })
      )
    })
  })
})
