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
   * @param {Object} [payload.signupTypeFlags] - Flags for signup type tracking
   *
   * @returns {AnalyticsTrackerAdapter}
   */
  userSignedIn(payload) {
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
