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
   * @returns {AnalyticsTrackerAdapter}
   */
  userSignedIn() {
    this.#trackerAdapter.addEvent({
      eventName: 'User Signed In',
      props: {}
    })
    return this.#trackerAdapter
  }

  /**
   * @returns {AnalyticsTrackerAdapter}
   */
  userFailedSignIn() {
    this.#trackerAdapter.addEvent({
      eventName: 'User Failed to Sign In',
      props: {}
    })
    return this.#trackerAdapter
  }
}
