export class SignUpTracker {
  /** @typedef TrackerAdapter - instance of AnalyticsTrackerAdapter */
  #trackerAdapter

  /**
   * Receives an instance of AnalyticsTrackerAdapter.
   * @param {import('analytics').AnalyticsInstance} adapter
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
   * @returns {AnalyticsTrackerAdapter}
   */
  userFailedSignUp() {
    this.#trackerAdapter.addEvent({
      eventName: 'User Failed to Sign Up',
      props: {}
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
