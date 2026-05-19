export class SignUpTracker {
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
   *
   * @returns {AnalyticsTrackerAdapter}
   */
  userSignedUp(payload) {
    this.#trackerAdapter.addEvent({
      eventName: 'User Signed Up',
      props: {
        method: payload.method
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
   *
   * @returns {AnalyticsTrackerAdapter}
   */
  userAuthorizedSso(payload) {
    this.#trackerAdapter.addEvent({
      eventName: 'User Authorized SSO',
      props: {
        method: payload.method
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
