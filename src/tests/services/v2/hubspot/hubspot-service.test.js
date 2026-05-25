import { httpService } from '@/services/v2/base/http/httpService'
import { hubspotService } from '@/services/v2/hubspot'
import { describe, expect, it, vi, beforeEach } from 'vitest'

vi.mock('@/services/v2/base/http/httpService')

describe('HubspotService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('VITE_HUBSPOT_API_URL', '')
  })

  describe('submitForm', () => {
    it('should send event with mandatory fields only', async () => {
      const requestSpy = vi.spyOn(httpService, 'request').mockResolvedValueOnce({
        statusCode: 200
      })

      await hubspotService.submitForm({
        email: 'test@example.com',
        form_action: 'signup_email',
        user_id__rtm_: 'user-123'
      })

      expect(requestSpy).toHaveBeenCalledWith({
        url: 'https://www.azion.com/api/hubspot/events',
        method: 'POST',
        body: {
          eventName: 'sign_up',
          email: 'test@example.com',
          utk: undefined,
          properties: {
            user_id__rtm_: 'user-123',
            form_action: 'signup_email'
          },
          form: {
            fields: {
              form_action: 'signup',
              email: 'test@example.com',
              segment__userid: 'user-123',
              rtm_id: 'user-123'
            }
          }
        },
        headers: {
          'Content-Type': 'application/json'
        },
        config: {}
      })
    })

    it('should send event with all optional fields', async () => {
      const requestSpy = vi.spyOn(httpService, 'request').mockResolvedValueOnce({
        statusCode: 200
      })

      await hubspotService.submitForm({
        email: 'test@example.com',
        form_action: 'signup_sso_google',
        user_id__rtm_: 'user-456',
        rtm_account_id: 'account-789',
        segment__annonymousid: 'anon-xyz',
        firstname: 'John',
        lastname: 'Doe',
        mobilephone: '+1234567890',
        company: 'Acme Inc',
        github_handle: 'johndoe',
        utk: 'hubspot-token-123',
        formContext: {
          hutk: 'hubspot-token-123',
          pageUri: 'https://console.azion.com/signup',
          pageName: 'Sign up'
        },
        utmParams: { utm_source: 'docs', utm_medium: 'web' }
      })

      expect(requestSpy).toHaveBeenCalledWith({
        url: 'https://www.azion.com/api/hubspot/events',
        method: 'POST',
        body: {
          eventName: 'sign_up',
          email: 'test@example.com',
          utk: 'hubspot-token-123',
          properties: {
            user_id__rtm_: 'user-456',
            form_action: 'signup_sso_google',
            firstname: 'John',
            lastname: 'Doe',
            mobilephone: '+1234567890',
            company: 'Acme Inc',
            github_handle: 'johndoe'
          },
          form: {
            fields: {
              form_action: 'signup',
              email: 'test@example.com',
              firstname: 'John',
              lastname: 'Doe',
              mobilephone: '+1234567890',
              company: 'Acme Inc',
              segment__userid: 'user-456',
              segment__annonymousid: 'anon-xyz',
              rtm_id: 'user-456',
              rtm_account_id: 'account-789',
              utm_source: 'docs',
              utm_medium: 'web'
            },
            context: {
              hutk: 'hubspot-token-123',
              pageUri: 'https://console.azion.com/signup',
              pageName: 'Sign up'
            }
          }
        },
        headers: {
          'Content-Type': 'application/json'
        },
        config: {}
      })
    })

    it('should use VITE_HUBSPOT_API_URL as base URL when configured', async () => {
      vi.stubEnv('VITE_HUBSPOT_API_URL', 'https://api-tracker.azion.com/api')
      // Re-import to pick up new env var
      const { hubspotService: customService } = await import(
        '@/services/v2/hubspot/hubspot-service.js?bust=' + Date.now()
      )
      const requestSpy = vi.spyOn(httpService, 'request').mockResolvedValueOnce({
        statusCode: 200
      })

      await customService.submitForm({
        email: 'test@example.com',
        form_action: 'signup_email',
        user_id__rtm_: 'user-123'
      })

      expect(requestSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'https://api-tracker.azion.com/api/hubspot/events'
        })
      )
    })

    it('should handle errors gracefully without throwing', async () => {
      vi.spyOn(httpService, 'request').mockRejectedValueOnce(new Error('Network error'))

      const result = await hubspotService.submitForm({
        email: 'test@example.com',
        form_action: 'signup_email',
        user_id__rtm_: 'user-123'
      })

      expect(result).toEqual({ success: false, error: 'Network error' })
    })

    it('should validate that email is required', async () => {
      const result = await hubspotService.submitForm({
        form_action: 'signup_email',
        user_id__rtm_: 'user-123'
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('email is required')
    })

    it('should validate that form_action is required', async () => {
      const result = await hubspotService.submitForm({
        email: 'test@example.com',
        user_id__rtm_: 'user-123'
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('form_action is required')
    })

    it('should validate that form_action has valid value', async () => {
      const result = await hubspotService.submitForm({
        email: 'test@example.com',
        form_action: 'invalid_action',
        user_id__rtm_: 'user-123'
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('Invalid form_action')
    })

    it('should map signup_* form_actions to sign_up event', async () => {
      const requestSpy = vi.spyOn(httpService, 'request').mockResolvedValue({
        statusCode: 200
      })

      const signupActions = ['signup_email', 'signup_sso_google', 'signup_sso_github']

      for (const formAction of signupActions) {
        await hubspotService.submitForm({
          email: 'test@example.com',
          form_action: formAction,
          user_id__rtm_: 'user-123'
        })

        const lastCall = requestSpy.mock.calls[requestSpy.mock.calls.length - 1]
        expect(lastCall[0].body.eventName).toBe('sign_up')
        expect(lastCall[0].body.properties.form_action).toBe(formAction)
      }
    })

    it('should map login_* form_actions to sign_in event', async () => {
      const requestSpy = vi.spyOn(httpService, 'request').mockResolvedValue({
        statusCode: 200
      })

      const loginActions = ['login_email', 'login_sso_google', 'login_sso_github']

      for (const formAction of loginActions) {
        await hubspotService.submitForm({
          email: 'test@example.com',
          form_action: formAction,
          user_id__rtm_: 'user-123'
        })

        const lastCall = requestSpy.mock.calls[requestSpy.mock.calls.length - 1]
        expect(lastCall[0].body.eventName).toBe('sign_in')
        expect(lastCall[0].body.properties.form_action).toBe(formAction)
      }
    })
  })
})
