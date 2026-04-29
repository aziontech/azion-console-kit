import { BaseService } from '@/services/v2/base/query/baseService'

const VALID_FORM_ACTIONS = [
  'signup_email',
  'signup_sso_google',
  'signup_sso_github',
  'login_email',
  'login_sso_google',
  'login_sso_github'
]

function getEventName(formAction) {
  if (formAction.startsWith('signup_')) return 'sign_up'
  if (formAction.startsWith('login_')) return 'sign_in'
  return formAction
}

function validatePayload(payload) {
  if (!payload.email) {
    throw new Error('email is required')
  }

  if (!payload.form_action) {
    throw new Error('form_action is required')
  }

  if (!VALID_FORM_ACTIONS.includes(payload.form_action)) {
    throw new Error(
      `Invalid form_action: ${payload.form_action}. Valid values: ${VALID_FORM_ACTIONS.join(', ')}`
    )
  }
}

export class HubspotService extends BaseService {
  async submitForm(payload) {
    try {
      validatePayload(payload)

      const properties = {
        user_id__rtm_: payload.user_id__rtm_,
        form_action: payload.form_action,
        ...(payload.firstname && { firstname: payload.firstname }),
        ...(payload.lastname && { lastname: payload.lastname }),
        ...(payload.mobilephone && { mobilephone: payload.mobilephone }),
        ...(payload.company && { company: payload.company }),
        ...(payload.github_handle && { github_handle: payload.github_handle }),
        ...(payload.context || {})
      }

      const baseUrl = import.meta.env.VITE_HUBSPOT_API_URL || ''
      const apiPath = '/hubspot/events'
      const url = baseUrl
        ? baseUrl.endsWith('/api')
          ? `${baseUrl}/hubspot/events`
          : `${baseUrl}${apiPath}`
        : apiPath

      await this.http.request({
        url,
        method: 'POST',
        config: baseUrl ? {} : { baseURL: '/api' },
        body: {
          eventName: getEventName(payload.form_action),
          email: payload.email,
          utk: payload.utk,
          properties
        },
        headers: {
          'Content-Type': 'application/json'
        }
      })

      return { success: true }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      return { success: false, error: errorMessage }
    }
  }
}

export const hubspotService = new HubspotService()
