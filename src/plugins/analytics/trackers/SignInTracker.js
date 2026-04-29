import { hubspotService } from '@/services/v2/hubspot'
import { getHubSpotUtk, getHubSpotContext } from '@/utils/cookies'

/**
 * Maps signin type flags to the appropriate form_action value for HubSpot.
 * @param {Object} signupTypeFlags - The signin type flags
 * @returns {string} The form_action value
 */
const FORM_ACTION_PRIORITY = [
  'login_sso_google',
  'login_sso_github',
  'login_email',
  'signup_sso_google',
  'signup_sso_github',
  'signup_email'
]

const DEFAULT_FORM_ACTION = 'login_email'

const getFormAction = (signupTypeFlags) =>
  FORM_ACTION_PRIORITY.find((action) => signupTypeFlags?.[action]) ?? DEFAULT_FORM_ACTION

export class SignInTracker {
  /**
   * Interface for TrackerAdapter.
   * @typedef {Object} trackerAdapter
   * @property {function({eventName: string, props: Object}): void} addEvent - Method to add an event.
   */
  #trackerAdapter

  /**
   * @param {trackerAdapter} trackerAdapter
   */
  constructor(adapter) {
    this.#trackerAdapter = adapter
  }

  /**
   * @param {Object} payload
   * @param {'google'|'azure'|'github'|'email'} payload.method
   * @param {Object} [payload.signupTypeFlags] - Flags for signin type tracking
   * @param {string} [payload.email] - User email for HubSpot
   * @param {string} [payload.userId] - Console user ID for HubSpot
   * @param {string} [payload.firstname] - User first name for HubSpot
   * @param {string} [payload.lastname] - User last name for HubSpot
   * @param {string} [payload.company] - Company name for HubSpot
   * @param {string} [payload.githubHandle] - GitHub handle for HubSpot
   * @param {string} [payload.phone] - User phone for HubSpot
   *
   * @returns {AnalyticsTrackerAdapter}
   */
  userSignedIn(payload) {
    // Get form_action from flags for both Segment and HubSpot
    const formAction = getFormAction(payload.signupTypeFlags)

    this.#trackerAdapter.addEvent({
      eventName: 'User Signed In',
      props: {
        method: payload.method,
        login_sso_google: payload.signupTypeFlags?.login_sso_google ?? false,
        login_sso_github: payload.signupTypeFlags?.login_sso_github ?? false,
        login_email: payload.signupTypeFlags?.login_email ?? false,
        signup_sso_google: payload.signupTypeFlags?.signup_sso_google ?? false,
        signup_sso_github: payload.signupTypeFlags?.signup_sso_github ?? false,
        signup_email: payload.signupTypeFlags?.signup_email ?? false
      }
    })

    // Submit to HubSpot if email and userId are provided
    if (payload.email && payload.userId) {
      hubspotService.submitForm({
        email: payload.email,
        form_action: formAction,
        user_id__rtm_: payload.userId,
        firstname: payload.firstname,
        lastname: payload.lastname,
        mobilephone: payload.phone,
        company: payload.company,
        github_handle: payload.githubHandle,
        utk: payload.utk ?? getHubSpotUtk(),
        context: getHubSpotContext()
      })
    }

    return this.#trackerAdapter
  }

  /**
   * @param {Object} payload
   * @param {'google'|'azure'|'github'|'email'} payload.method
   *
   * @returns {AnalyticsTrackerAdapter}
   */
  userClickedSignIn(payload) {
    this.#trackerAdapter.addEvent({
      eventName: 'User Clicked to Sign In',
      props: {
        method: payload.method
      }
    })
    return this.#trackerAdapter
  }

  /**
   * @param {Object} payload
   * @param {'google'|'azure'|'github'|'email'} payload.method
   * @param {Object} [payload.signupTypeFlags] - Flags for signup type tracking
   *
   * @returns {AnalyticsTrackerAdapter}
   */
  userFailedSignIn(payload) {
    this.#trackerAdapter.addEvent({
      eventName: 'User Failed to Sign In',
      props: {
        method: payload.method,
        login_sso_google: payload.signupTypeFlags?.login_sso_google ?? false,
        login_sso_github: payload.signupTypeFlags?.login_sso_github ?? false,
        login_email: payload.signupTypeFlags?.login_email ?? false,
        signup_sso_google: payload.signupTypeFlags?.signup_sso_google ?? false,
        signup_sso_github: payload.signupTypeFlags?.signup_sso_github ?? false,
        signup_email: payload.signupTypeFlags?.signup_email ?? false
      }
    })
    return this.#trackerAdapter
  }
}
