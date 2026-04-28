import { AxiosHttpClientAdapter } from '../axios/AxiosHttpClientAdapter'

/**
 * HubSpot Events API Service
 *
 * Sends custom behavioral events to HubSpot via api-tracker proxy.
 * The api-tracker handles the actual HubSpot API authentication.
 *
 * API endpoint: POST /api/hubspot/events
 * Body: { eventName, email?, utk?, objectId?, properties? }
 */

const VALID_FORM_ACTIONS = [
  'signup_email',
  'signup_sso_google',
  'signup_sso_github',
  'login_email',
  'login_sso_google',
  'login_sso_github'
]

/**
 * Maps form_action to HubSpot event name.
 * signup_* actions → sign_up event
 * login_* actions → sign_in event
 */
function getEventName(formAction) {
  if (formAction.startsWith('signup_')) return 'sign_up'
  if (formAction.startsWith('login_')) return 'sign_in'
  return formAction
}

/**
 * Validates the payload for required fields and valid form_action.
 * @param {Object} payload - The form payload
 * @throws {Error} If validation fails
 */
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

/**
 * Sends a custom behavioral event to HubSpot via api-tracker.
 *
 * @param {Object} payload - The event payload
 * @param {string} payload.email - User email (required)
 * @param {string} payload.form_action - Event name: signup_email | signup_sso_google | signup_sso_github | login_email | login_sso_google | login_sso_github
 * @param {string} payload.user_id__rtm_ - Console user ID
 * @param {string} [payload.firstname] - User first name
 * @param {string} [payload.lastname] - User last name
 * @param {string} [payload.mobilephone] - User phone
 * @param {string} [payload.company] - Company name
 * @param {string} [payload.github_handle] - GitHub handle
 * @param {string} [payload.utk] - HubSpot user token (optional)
 * @param {Object} [payload.context] - HubSpot context properties (hs_* properties)
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const hubspotFormSubmitService = async (payload) => {
  try {
    validatePayload(payload)

    // Build properties object with user data and context
    const properties = {
      user_id__rtm_: payload.user_id__rtm_,
      form_action: payload.form_action,
      // User properties
      ...(payload.firstname && { firstname: payload.firstname }),
      ...(payload.lastname && { lastname: payload.lastname }),
      ...(payload.mobilephone && { mobilephone: payload.mobilephone }),
      ...(payload.company && { company: payload.company }),
      ...(payload.github_handle && { github_handle: payload.github_handle }),
      // HubSpot context properties (hs_*)
      ...(payload.context || {})
    }

    // API endpoint - uses relative path when deployed alongside api-tracker
    // or VITE_HUBSPOT_API_URL for standalone/local development
    const baseUrl = import.meta.env.VITE_HUBSPOT_API_URL || ''
    const url = `${baseUrl}/api/hubspot/events`

    await AxiosHttpClientAdapter.request({
      url,
      method: 'POST',
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

    // Log error but don't block the signup flow
    // eslint-disable-next-line no-console
    console.warn('HubSpot event submission failed:', {
      error: errorMessage,
      email: payload.email,
      form_action: payload.form_action
    })

    return { success: false, error: errorMessage }
  }
}
