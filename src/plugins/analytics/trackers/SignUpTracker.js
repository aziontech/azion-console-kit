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
   * @returns {AnalyticsTrackerAdapter}
   */
  userSignedUp() {
    this.#trackerAdapter.addEvent({
      eventName: 'User Signed Up',
      props: {}
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
  submittedAdditionalData() {
    this.#trackerAdapter.addEvent({
      eventName: 'Submitted Additional Data',
      props: {}
    })
    return this.#trackerAdapter
  }

  /**
   * @returns {AnalyticsTrackerAdapter}
   */
  failedSubmitAdditionalData() {
    this.#trackerAdapter.addEvent({
      eventName: 'Failed to Submit Additional Data',
      props: {}
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
