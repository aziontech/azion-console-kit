import { SignUpTracker } from './trackers/SignUpTracker'
import { SignInTracker } from './trackers/SignInTracker'
import { CreateTracker } from './trackers/CreateTracker'

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

  /** @type {SignUpTracker} - events related to signup product */
  #signUpTracker = null
  /** @type {SignInTracker} - events related to signin product */
  #signInTracker = null
  /** @type {CreateTracker} - events related to create entity */
  #createTracker = null

  /**
   * Creates an instance of AnalyticsTrackerAdapter.
   * @param {import('analytics').AnalyticsInstance} analyticsClient - The client for tracking.
   */
  constructor(analyticsClient) {
    this.#analyticsClient = analyticsClient

    this.#signUpTracker = new SignUpTracker(this)
    this.#signInTracker = new SignInTracker(this)
    this.#createTracker = new CreateTracker(this)
  }

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
   * Getter for the signUp property.
   *
   * @return {SignUpTracker} SignUpTracker instance
   */
  get signUp() {
    return this.#signUpTracker
  }

  /**
   * Getter for the signIn property.
   *
   * @return {SignInTracker} SignInTracker instance
   */
  get signIn() {
    return this.#signInTracker
  }

  /**
   * Get for the CreateTracker property.
   *
   * @return {CreateTracker} CreateTracker instance
   */
  get create() {
    return this.#createTracker
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
   * @param {Object} payload
   * @param {AzionProductsNames} payload.productName
   * @returns {AnalyticsTrackerAdapter}
   */
  clickToEdit(payload) {
    this.#events.push({
      eventName: `Clicked to Edit ${payload.productName}`,
      props: {}
    })
    return this
  }

  /**
   * @param {Object} payload
   * @param {AzionProductsNames} payload.productName
   * @returns {AnalyticsTrackerAdapter}
   */
  productCreated(payload) {
    this.#events.push({
      eventName: `Created ${payload.productName}`,
      props: {}
    })
    return this
  }

  /**
   * @param {Object} payload
   * @param {AzionProductsNames} payload.productName
   * @returns {AnalyticsTrackerAdapter}
   */
  productEdited(payload) {
    this.#events.push({
      eventName: `Edited ${payload.productName}`,
      props: {}
    })
    return this
  }

  /**
   * @param {Object} payload
   * @param {AzionProductsNames} payload.productName
   * @param {String} payload.errorType
   * @param {String} payload.fieldName
   * @param {String} payload.errorMessage
   * @returns {AnalyticsTrackerAdapter}
   */
  failedToCreate(payload) {
    this.#events.push({
      eventName: `Failed to Create ${payload.productName}`,
      props: {
        errorType: payload.errorType,
        fieldName: payload.fieldName,
        errorMessage: payload.errorMessage
      }
    })
    return this
  }

  /**
   * @param {Object} payload
   * @param {AzionProductsNames} payload.productName
   * @param {String} payload.errorType
   * @param {String} payload.fieldName
   * @param {String} payload.errorMessage
   * @returns {AnalyticsTrackerAdapter}
   */
  failedToEdit(payload) {
    this.#events.push({
      eventName: `Failed to Edit ${payload.productName}`,
      props: {
        errorType: payload.errorType,
        fieldName: payload.fieldName,
        errorMessage: payload.errorMessage
      }
    })
    return this
  }
}
