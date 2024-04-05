import { SignUpTracker, SignInTracker, CreateTracker, ProductTracker } from './trackers'

/**
 * @typedef {Object} TrackerEvent
 * @property {string} eventName - The name of the event.
 * @property {Object} [props] - Additional properties associated with the event.
 */

/**
 * @typedef {'Edge Application'|'Origins'|'Domains'} AzionProductsNames
 */

export class AnalyticsTrackerAdapter {
  /** @type {TrackerEvent[]} */
  #events = []
  /** @type {import('analytics').AnalyticsInstance} */
  #analyticsClient = null
  #traits = {}

  /** @type {SignUpTracker} */
  #signUpTracker = null
  /** @type {SignInTracker} */
  #signInTracker = null
  /** @type {CreateTracker} */
  #createTracker = null
  /** @type {ProductTracker} */
  #productTracker = null

  /**
   * Creates an instance of AnalyticsTrackerAdapter.
   * @param {import('analytics').AnalyticsInstance} analyticsClient - The client for tracking.
   */
  constructor(analyticsClient) {
    this.#analyticsClient = analyticsClient

    this.#signUpTracker = new SignUpTracker(this)
    this.#signInTracker = new SignInTracker(this)
    this.#createTracker = new CreateTracker(this)
    this.#productTracker = new ProductTracker(this)
  }

  /**
   * A method to add an event to the events array.
   *
   * @param {Object} event - the event to be added
   */
  addEvent(event) {
    this.#events.push(event)
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

  /**
   * A method to identify a user.
   *
   * @param {type} id - The identifier of the user
   * @return {Promise<void>}
   */
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
   * @return {SignUpTracker}
   */
  get signUp() {
    return this.#signUpTracker
  }

  /**
   * @return {SignInTracker}
   */
  get signIn() {
    return this.#signInTracker
  }

  /**
   * @return {CreateTracker}
   */
  get create() {
    return this.#createTracker
  }

  /**
   * @return {ProductTracker}
   */
  get product() {
    return this.#productTracker
  }
}
