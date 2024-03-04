export class SignInTracker {
  #adapter

  constructor(adapter) {
    this.#adapter = adapter
  }

  /**
   * @returns {AnalyticsTrackerAdapter}
   */
  userSignedIn() {
    this.#adapter.addEvent({
      eventName: 'User Signed In',
      props: {}
    })
    return this.#adapter
  }

  /**
   * @returns {AnalyticsTrackerAdapter}
   */
  userFailedSignIn() {
    this.#adapter.addEvent({
      eventName: 'User Failed to Sign In',
      props: {}
    })
    return this.#adapter
  }
}
