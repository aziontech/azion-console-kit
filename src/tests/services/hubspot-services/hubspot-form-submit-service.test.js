import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { hubspotFormSubmitService } from '@/services/hubspot-services/hubspot-form-submit-service'
import { describe, expect, it, vi, beforeEach } from 'vitest'

vi.mock('@/services/axios/AxiosHttpClientAdapter')

describe('hubspotFormSubmitService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset import.meta.env mock
    vi.stubEnv('VITE_HUBSPOT_API_URL', '')
  })

  it('should send event with mandatory fields only', async () => {
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
      url: '/api/hubspot/events',
      method: 'POST',
      body: {
        eventName: 'signup_email',
        email: 'test@example.com',
        utk: undefined,
        properties: {
          user_id__rtm_: 'user-123',
          segment_userid: 'user-123'
        }
      },
      headers: {
        'Content-Type': 'application/json'
      }
    })
  })

  it('should send event with all optional fields', async () => {
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
      github_handle: 'johndoe',
      utk: 'hubspot-token-123'
    })

    expect(requestSpy).toHaveBeenCalledWith({
      url: '/api/hubspot/events',
      method: 'POST',
      body: {
        eventName: 'signup_sso_google',
        email: 'test@example.com',
        utk: 'hubspot-token-123',
        properties: {
          user_id__rtm_: 'user-456',
          segment_userid: 'user-456',
          firstname: 'John',
          lastname: 'Doe',
          mobilephone: '+1234567890',
          company: 'Acme Inc',
          github_handle: 'johndoe'
        }
      },
      headers: {
        'Content-Type': 'application/json'
      }
    })
  })

  it('should use VITE_HUBSPOT_API_URL as base URL when configured', async () => {
    vi.stubEnv('VITE_HUBSPOT_API_URL', 'https://api-tracker.azion.com')
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200
    })

    await hubspotFormSubmitService({
      email: 'test@example.com',
      form_action: 'signup_email',
      user_id__rtm_: 'user-123',
      segment_userid: 'user-123'
    })

    expect(requestSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'https://api-tracker.azion.com/api/hubspot/events'
      })
    )
  })

  it('should handle errors gracefully without throwing', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockRejectedValueOnce(new Error('Network error'))
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const result = await hubspotFormSubmitService({
      email: 'test@example.com',
      form_action: 'signup_email',
      user_id__rtm_: 'user-123',
      segment_userid: 'user-123'
    })

    expect(result).toEqual({ success: false, error: 'Network error' })

    expect(consoleWarnSpy).toHaveBeenCalledWith('HubSpot event submission failed:', {
      error: 'Network error',
      email: 'test@example.com',
      form_action: 'signup_email'
    })
  })

  it('should validate that email is required', async () => {

    const result = await hubspotFormSubmitService({
      form_action: 'signup_email',
      user_id__rtm_: 'user-123',
      segment_userid: 'user-123'
    })

    expect(result.success).toBe(false)
    expect(result.error).toBe('email is required')
  })

  it('should validate that form_action is required', async () => {

    const result = await hubspotFormSubmitService({
      email: 'test@example.com',
      user_id__rtm_: 'user-123',
      segment_userid: 'user-123'
    })

    expect(result.success).toBe(false)
    expect(result.error).toBe('form_action is required')
  })

  it('should validate that form_action has valid value', async () => {

    const result = await hubspotFormSubmitService({
      email: 'test@example.com',
      form_action: 'invalid_action',
      user_id__rtm_: 'user-123',
      segment_userid: 'user-123'
    })

    expect(result.success).toBe(false)
    expect(result.error).toContain('Invalid form_action')
  })

  it('should use correct eventName for different form_action values', async () => {
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
      expect(lastCall[0].body.eventName).toBe(formAction)
    }
  })
})
