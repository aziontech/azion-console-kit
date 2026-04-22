import { AxiosHttpClientAdapter } from '../axios/AxiosHttpClientAdapter'

const HUBSPOT_FORM_ID = 'b37e4a6a-8808-4e53-862a-7f82728138b9'
const HUBSPOT_PORTAL_ID = '145499104'

const REQUIRED_FIELDS = ['email', 'form_action', 'user_id__rtm_', 'segment_userid']

const OPTIONAL_FIELDS_MAP = {
  firstname: 'firstname',
  lastname: 'lastname',
  mobilephone: 'mobilephone',
  company: 'company',
  github_handle: 'github_handle'
}

const VALID_FORM_ACTIONS = [
  'signup_email',
  'signup_sso_google',
  'signup_sso_github',
  'login_email',
  'login_sso_google',
  'login_sso_github'
]

/**
 * Validates the payload for required fields and valid form_action.
 * @param {Object} payload - The form payload
 * @throws {Error} If validation fails
 */
function validatePayload(payload) {
  const missingFields = REQUIRED_FIELDS.filter((field) => !payload[field])

  if (missingFields.length > 0) {
    throw new Error(`Missing required fields: ${missingFields.join(', ')}`)
  }

  if (!VALID_FORM_ACTIONS.includes(payload.form_action)) {
    throw new Error(
      `Invalid form_action: ${payload.form_action}. Valid values: ${VALID_FORM_ACTIONS.join(', ')}`
    )
  }

  if (payload.user_id__rtm_ !== payload.segment_userid) {
    throw new Error('user_id__rtm_ must equal segment_userid')
  }
}

/**
 * Builds the fields array for HubSpot API from payload.
 * @param {Object} payload - The form payload
 * @returns {Array} Array of field objects
 */
function buildFields(payload) {
  const requiredFields = REQUIRED_FIELDS.map((field) => ({
    name: field,
    value: payload[field]
  }))

  const optionalFields = Object.entries(OPTIONAL_FIELDS_MAP)
    .filter(([key]) => payload[key])
    .map(([key, fieldName]) => ({
      name: fieldName,
      value: payload[key]
    }))

  return [...requiredFields, ...optionalFields]
}

/**
 * Submits a form to HubSpot Forms API.
 * @param {Object} payload - The form payload
 * @param {string} payload.email - User email (mandatory)
 * @param {string} payload.form_action - Form action type (mandatory): signup_email | signup_sso_google | signup_sso_github | login_email | login_sso_google | login_sso_github
 * @param {string} payload.user_id__rtm_ - Console user ID (mandatory, must equal segment_userid)
 * @param {string} payload.segment_userid - Console user ID (mandatory)
 * @param {string} [payload.firstname] - User first name
 * @param {string} [payload.lastname] - User last name
 * @param {string} [payload.mobilephone] - User phone
 * @param {string} [payload.company] - Company name
 * @param {string} [payload.github_handle] - GitHub handle
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const hubspotFormSubmitService = async (payload) => {
  try {
    validatePayload(payload)

    const fields = buildFields(payload)
    const url = `https://api.hsforms.com/submissions/v3/integration/submit/${HUBSPOT_PORTAL_ID}/${HUBSPOT_FORM_ID}`

    await AxiosHttpClientAdapter.request({
      url,
      method: 'POST',
      body: { fields },
      headers: {
        'Content-Type': 'application/json'
      }
    })

    return { success: true }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    // Log error but don't block the signup flow
    // eslint-disable-next-line no-console
    console.warn('HubSpot form submission failed:', {
      error: errorMessage,
      email: payload.email,
      form_action: payload.form_action
    })

    return { success: false, error: errorMessage }
  }
}
