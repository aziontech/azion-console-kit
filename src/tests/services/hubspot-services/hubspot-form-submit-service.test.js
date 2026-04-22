import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { hubspotFormSubmitService } from '@/services/hubspot-services/hubspot-form-submit-service'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/services/axios/AxiosHttpClientAdapter')

describe('hubspotFormSubmitService', () => {
  it('should submit form with mandatory fields only', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200
    })

    await hubspotFormSubmitService({
      email: 'test@example.com',
      form_action: 'signup_email',
      user_id__rtm_: 'user-123',
      segment_userid: 'user-123'
    })

    expect(requestSpy).toHaveBeenCalledWith({
      url: 'https://api.hsforms.com/submissions/v3/integration/submit/145499104/b37e4a6a-8808-4e53-862a-7f82728138b9',
      method: 'POST',
      body: {
        fields: [
          { name: 'email', value: 'test@example.com' },
          { name: 'form_action', value: 'signup_email' },
          { name: 'user_id__rtm_', value: 'user-123' },
          { name: 'segment_userid', value: 'user-123' }
        ]
      },
      headers: {
        'Content-Type': 'application/json'
      }
    })
  })

  it('should submit form with all optional fields', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200
    })

    await hubspotFormSubmitService({
      email: 'test@example.com',
      form_action: 'signup_sso_google',
      user_id__rtm_: 'user-456',
      segment_userid: 'user-456',
      firstname: 'John',
      lastname: 'Doe',
      mobilephone: '+1234567890',
      company: 'Acme Inc',
      github_handle: 'johndoe'
    })

    expect(requestSpy).toHaveBeenCalledWith({
      url: 'https://api.hsforms.com/submissions/v3/integration/submit/145499104/b37e4a6a-8808-4e53-862a-7f82728138b9',
      method: 'POST',
      body: {
        fields: [
          { name: 'email', value: 'test@example.com' },
          { name: 'form_action', value: 'signup_sso_google' },
          { name: 'user_id__rtm_', value: 'user-456' },
          { name: 'segment_userid', value: 'user-456' },
          { name: 'firstname', value: 'John' },
          { name: 'lastname', value: 'Doe' },
          { name: 'mobilephone', value: '+1234567890' },
          { name: 'company', value: 'Acme Inc' },
          { name: 'github_handle', value: 'johndoe' }
        ]
      },
      headers: {
        'Content-Type': 'application/json'
      }
    })
  })

  it('should handle errors gracefully without throwing', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockRejectedValueOnce(new Error('Network error'))
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    // Should not throw
    const result = await hubspotFormSubmitService({
      email: 'test@example.com',
      form_action: 'signup_email',
      user_id__rtm_: 'user-123',
      segment_userid: 'user-123'
    })

    expect(result).toEqual({ success: false, error: 'Network error' })

    expect(consoleWarnSpy).toHaveBeenCalledWith('HubSpot form submission failed:', {
      error: 'Network error',
      email: 'test@example.com',
      form_action: 'signup_email'
    })
  })

  it('should use correct form_action values for different signup types', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValue({
      statusCode: 200
    })

    const formActions = [
      'signup_email',
      'signup_sso_google',
      'signup_sso_github',
      'login_email',
      'login_sso_google',
      'login_sso_github'
    ]

    for (const formAction of formActions) {
      await hubspotFormSubmitService({
        email: 'test@example.com',
        form_action: formAction,
        user_id__rtm_: 'user-123',
        segment_userid: 'user-123'
      })

      const lastCall = requestSpy.mock.calls[requestSpy.mock.calls.length - 1]
      const formActionField = lastCall[0].body.fields.find((field) => field.name === 'form_action')
      expect(formActionField.value).toBe(formAction)
    }
  })
})
