export class SignUpTracker {
  #adapter

  constructor(adapter) {
    this.#adapter = adapter
  }

  /**
   * @returns {AnalyticsTrackerAdapter}
   */
  userSignedUp() {
    this.#adapter.addEvent({
      eventName: 'User Signed Up',
      props: {}
    })
    return this.#adapter
  }

  /**
   * @returns {AnalyticsTrackerAdapter}
   */
  userFailedSignUp() {
    this.#adapter.addEvent({
      eventName: 'User Failed to Sign Up',
      props: {}
    })
    return this.#adapter
  }

  /**
   * @returns {AnalyticsTrackerAdapter}
   */
  submittedAdditionalData() {
    this.#adapter.addEvent({
      eventName: 'Submitted Additional Data',
      props: {}
    })
    return this.#adapter
  }

  /**
   * @returns {AnalyticsTrackerAdapter}
   */
  failedSubmitAdditionalData() {
    this.#adapter.addEvent({
      eventName: 'Failed to Submit Additional Data',
      props: {}
    })
    return this.#adapter
  }

  /**
   * @returns {AnalyticsTrackerAdapter}
   */
  userActivatedAccount() {
    this.#adapter.addEvent({
      eventName: 'User Activated Account',
      props: {}
    })
    return this.#adapter
  }
}
