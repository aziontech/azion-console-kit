/**
 * @typedef {Object} TrackerEvent
 * @property {string} eventName - The name of the event.
 * @property {Object} [props] - Additional properties associated with the event.
 */

/**
 * @typedef {'Edge Application'|'Origins'|'Domains'} AzionProductsNames
 */

/**
 * @typedef {Object} AnalyticsAdapter
 * @property {Function} identify - Identifies a user.
 * @property {Function} assignGroupTraits - Assigns traits to a user group.
 * @property {Function} pageLoad - Tracks a page load event.
 * @property {Function} click - Tracks a click event.
 * @property {Function} track - Tracks all queued events.
 */
export class AnalyticsTrackerAdapter {
  /** @type {TrackerEvent[]} */
  #events = []
  /** @type {import('analytics').AnalyticsInstance} */
  #analyticsClient = null
  #traits = {}

  /**
   * Creates an instance of AnalyticsTrackerAdapter.
   * @param {import('analytics').AnalyticsInstance} analyticsClient - The client for tracking.
   */
  constructor(analyticsClient) {
    this.#analyticsClient = analyticsClient
  }

  async identify(id) {
    if (!id) {
      return
    }
    await this.#analyticsClient.identify(id, this.#traits)
  }

  /**
   *
   * @param {Object} traitsToAssign - traits that should be sended with all tracking calls
   */
  assignGroupTraits(traitsToAssign) {
    if (!traitsToAssign) {
      throw new Error('Invalid traits provided')
    }
    this.#traits = { ...traitsToAssign }
  }

  /**
   * @param {Object} payload
   * @param {string} payload.url
   * @returns {AnalyticsTrackerAdapter}
   */
  pageLoad(payload) {
    this.#events.push({
      eventName: 'Page Loaded',
      props: {
        url: payload.url
      }
    })
    return this
  }

  /**
   * @param {Object} payload
   * @param {AzionProductsNames} payload.productName
   * @returns {AnalyticsTrackerAdapter}
   */
  clickToCreate(payload) {
    this.#events.push({
      eventName: `Clicked to Create ${payload.productName}`,
      props: {}
    })
    return this
  }

  /**
   * @returns {AnalyticsTrackerAdapter}
   */
  userSigned() {
    this.#events.push({
      eventName: "User Signed In",
      props: {}
    })
    return this
  }

  /**
   * call this method to run each stored tracker event
   */
  async track() {
    this.#events.forEach(async (action) => {
      const { eventName, props } = action
      const propsWithTraits = { ...props, ...this.#traits }
      await this.#analyticsClient.track(eventName, propsWithTraits)
    })
    this.#events = []
  }
}
