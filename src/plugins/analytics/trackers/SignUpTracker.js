import { hubspotService } from '@/services/v2/hubspot'
import { getHubSpotUtk, getHubSpotContext } from '@/utils/cookies'

const FORM_ACTION_PRIORITY = [
  'signup_sso_google',
  'signup_sso_github',
  'signup_email',
  'login_sso_google',
  'login_sso_github',
  'login_email'
]

const DEFAULT_FORM_ACTION = 'signup_email'

const getFormAction = (signupTypeFlags) =>
  FORM_ACTION_PRIORITY.find((action) => signupTypeFlags?.[action]) ?? DEFAULT_FORM_ACTION

export class SignUpTracker {
  /**
   * Interface for TrackerAdapter.
   * @typedef {Object} trackerAdapter
   * @property {function({eventName: string, props: Object}): void} addEvent - Method to add an event.
   * @property {function(): Object} getUserContext - Method to get user context for HubSpot.
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
   * @param {string} [payload.firstSessionUrl] - The first session URL
   * @param {Object} [payload.signupTypeFlags] - Flags for signup type tracking
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
  userSignedUp(payload) {
    // Get signup_type from flags for both Segment and HubSpot
    const signupType = getFormAction(payload.signupTypeFlags)

    // Add Segment event
    this.#trackerAdapter.addEvent({
      eventName: 'User Signed Up',
      props: {
        method: payload.method,
        first_session_url: payload.firstSessionUrl,
        signup_type: signupType,
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
        form_action: signupType,
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
  userClickedSignedUp(payload) {
    this.#trackerAdapter.addEvent({
      eventName: 'User Clicked to Sign Up',
      props: {
        method: payload.method
      }
    })
    return this.#trackerAdapter
  }

  /**
   * @param {Object} payload
   * @param {'google'|'azure'|'github'} payload.method
   * @param {string} [payload.firstSessionUrl] - The first session URL
   * @param {Object} [payload.signupTypeFlags] - Flags for signup type tracking
   *
   * @returns {AnalyticsTrackerAdapter}
   */
  userAuthorizedSso(payload) {
    // Get signup_type from flags for consistency
    const signupType = getFormAction(payload.signupTypeFlags)

    this.#trackerAdapter.addEvent({
      eventName: 'User Authorized SSO',
      props: {
        method: payload.method,
        first_session_url: payload.firstSessionUrl,
        signup_type: signupType,
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

  /**
   * @param {Object} payload
   * @param {'api'|'field'} payload.errorType
   * @param {string} payload.fieldName
   * @param {string} payload.errorMessage
   *
   * @returns {AnalyticsTrackerAdapter}
   */
  userFailedSignUp(payload) {
    this.#trackerAdapter.addEvent({
      eventName: 'User Failed to Sign Up',
      props: {
        errorType: payload.errorType,
        fieldName: payload.fieldName,
        errorMessage: payload.errorMessage
      }
    })
    return this.#trackerAdapter
  }

  /**
   * @returns {AnalyticsTrackerAdapter}
   */
  submittedAdditionalData(payload) {
    this.#trackerAdapter.addEvent({
      eventName: 'Submitted Additional Data',
      props: {
        use: payload.use,
        role: payload.role,
        inputRole: payload.inputRole,
        companySize: payload.companySize,
        onboardingSchedule: payload.onboardingSession,
        website: payload.companyWebsite,
        name: payload.fullName
      }
    })
    return this.#trackerAdapter
  }

  /**
   * @returns {AnalyticsTrackerAdapter}
   */
  failedSubmitAdditionalData(payload) {
    this.#trackerAdapter.addEvent({
      eventName: 'Failed to Submit Additional Data',
      props: {
        errorType: payload.errorType,
        errorMessage: payload.errorMessage,
        fieldName: payload.fieldName
      }
    })
    return this.#trackerAdapter
  }

  /**
   * @returns {AnalyticsTrackerAdapter}
   */
  userActivatedAccount() {
    this.#trackerAdapter.addEvent({
      eventName: 'User Activated Account',
      props: {}
    })
    return this.#trackerAdapter
  }
}
