import { AxiosHttpClientAdapter } from '../axios/AxiosHttpClientAdapter'

const HUBSPOT_FORM_ID = 'b37e4a6a-8808-4e53-862a-7f82728138b9'
const HUBSPOT_PORTAL_ID = '145499104'

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
 * @returns {Promise<void>}
 */
export const hubspotFormSubmitService = async (payload) => {
  const fields = [
    { name: 'email', value: payload.email },
    { name: 'form_action', value: payload.form_action },
    { name: 'user_id__rtm_', value: payload.user_id__rtm_ },
    { name: 'segment_userid', value: payload.segment_userid }
  ]

  // Add optional fields if provided
  if (payload.firstname) {
    fields.push({ name: 'firstname', value: payload.firstname })
  }
  if (payload.lastname) {
    fields.push({ name: 'lastname', value: payload.lastname })
  }
  if (payload.mobilephone) {
    fields.push({ name: 'mobilephone', value: payload.mobilephone })
  }
  if (payload.company) {
    fields.push({ name: 'company', value: payload.company })
  }
  if (payload.github_handle) {
    fields.push({ name: 'github_handle', value: payload.github_handle })
  }

  const url = `https://api.hsforms.com/submissions/v3/integration/submit/${HUBSPOT_PORTAL_ID}/${HUBSPOT_FORM_ID}`

  try {
    await AxiosHttpClientAdapter.request({
      url,
      method: 'POST',
      body: { fields },
      headers: {
        'Content-Type': 'application/json'
      }
    })
  } catch (error) {
    // Log error but don't block the signup flow
    // eslint-disable-next-line no-console
    console.warn('HubSpot form submission failed:', error)
  }
}
