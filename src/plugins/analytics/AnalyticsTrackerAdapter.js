import {
  SignUpTracker,
  SignInTracker,
  CreateTracker,
  ProductTracker,
  WafRulesTracker,
  RealTimeMetricsTracker
} from './trackers'
import { cleanObject } from '../../utils/cleanObject.js'

const logTrackerError = (operation, err) => {
  // eslint-disable-next-line no-console
  console.warn(
    JSON.stringify({
      level: 'warn',
      tag: 'analytics-tracker',
      event: 'operation_failed',
      operation,
      msg: err?.message,
      ts: Date.now()
    })
  )
}

/**
 * @typedef {Object} TrackerEvent
 * @property {string} eventName - The name of the event.
 * @property {Object} [props] - Additional properties associated with the event.
 */

/**
 * @typedef {'Edge Application'|'Origins'|'Domains'|'Edge Functions'} AzionProductsNames
 */

export class AnalyticsTrackerAdapter {
  /** @type {TrackerEvent[]} */
  #events = []
  /** @type {import('@/plugins/factories/analytics-tracking-factory').AnalyticsClient} */
  #analyticsClient = null
  /** @type {Boolean} */
  #hasAnalyticsClient = false
  #traits = {}

  /** @type {SignUpTracker} */
  #signUpTracker = null
  /** @type {SignInTracker} */
  #signInTracker = null
  /** @type {CreateTracker} */
  #createTracker = null
  /** @type {ProductTracker} */
  #productTracker = null
  /** @type {WafTracker} */
  #wafRulesTracker = null
  /** @type {RealTimeMetricsTracker} */
  #realTimeMetricsTracker = null

  /**
   * Creates an instance of AnalyticsTrackerAdapter.
   * @param {import('@/plugins/factories/analytics-tracking-factory').AnalyticsClient} analyticsClient - The client for tracking.
   */
  constructor(analyticsClient) {
    this.#hasAnalyticsClient = !!analyticsClient
    this.#analyticsClient = analyticsClient

    this.#signUpTracker = new SignUpTracker(this)
    this.#signInTracker = new SignInTracker(this)
    this.#createTracker = new CreateTracker(this)
    this.#productTracker = new ProductTracker(this)
    this.#wafRulesTracker = new WafRulesTracker(this)
    this.#realTimeMetricsTracker = new RealTimeMetricsTracker(this)
  }

  /**
   * A method to add an event to the events array.
   *
   * @param {Object} event - the event to be added
   */
  addEvent(event) {
    this.#events.push(event)
  }

  #hasAnalytics() {
    return this.#hasAnalyticsClient
  }
  /**
   * call this method to run each stored tracker event
   */
  async track() {
    if (!this.#hasAnalytics()) return
    const queued = this.#events
    this.#events = []
    queued.forEach((action) => {
      try {
        const { eventName, props } = action
        const propsWithTraits = cleanObject({
          ...props,
          ...this.#traits,
          application: 'console-kit'
        })
        // Fire-and-forget: the underlying client already handles network
        // failures internally; we still guard sync errors (cleanObject, etc).
        Promise.resolve(this.#analyticsClient.track(eventName, propsWithTraits)).catch((err) =>
          logTrackerError('track', err)
        )
      } catch (err) {
        logTrackerError('track', err)
      }
    })
  }

  /**
   * A method to identify a user.
   *
   * @param {type} id - The identifier of the user
   * @return {Promise<void>}
   */
  async identify(id) {
    if (id === undefined || id === null || id === '' || !this.#hasAnalytics()) return

    try {
      const cleanedTraits = cleanObject(this.#traits)
      await this.#analyticsClient.identify(String(id), cleanedTraits)
    } catch (err) {
      logTrackerError('identify', err)
    }
  }

  /**
   * Resets the internal state of the tracker, including any queued events and traits.
   */
  reset() {
    this.#events = []
    this.#traits = {}
    if (!this.#hasAnalytics()) return
    try {
      this.#analyticsClient.reset()
    } catch (err) {
      logTrackerError('reset', err)
    }
  }

  /**
   *
   * @param {Object} traitsToAssign - traits that should be sended with all tracking calls
   */
  assignGroupTraits(traitsToAssign) {
    if (!this.#hasAnalytics()) return
    if (!traitsToAssign || typeof traitsToAssign !== 'object') {
      throw new Error('Invalid traits provided')
    }
    this.#traits = cleanObject(traitsToAssign)
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

  /**
   * @return {ProductTracker}
   */
  get wafRules() {
    return this.#wafRulesTracker
  }

  /**
   * @return {RealTimeMetricsTracker}
   */
  get realTimeMetrics() {
    return this.#realTimeMetricsTracker
  }
}
