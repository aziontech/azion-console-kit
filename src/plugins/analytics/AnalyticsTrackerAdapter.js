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

const APPLICATION_TRAIT = 'console-kit'

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

  /**
   * Flushes queued events to the analytics client. Fire-and-forget: the
   * underlying client already swallows network failures, but we still guard
   * synchronous errors (cleanObject, etc) so a single bad event never aborts
   * the whole batch.
   */
  async track() {
    if (!this.#hasAnalyticsClient) return
    const queued = this.#events
    this.#events = []
    queued.forEach((action) => {
      try {
        const propsWithTraits = cleanObject({
          ...action.props,
          ...this.#traits,
          application: APPLICATION_TRAIT
        })
        Promise.resolve(this.#analyticsClient.track(action.eventName, propsWithTraits)).catch(
          (err) => logTrackerError('track', err)
        )
      } catch (err) {
        logTrackerError('track', err)
      }
    })
  }

  /**
   * Identifies a user. Empty/null/undefined ids are ignored.
   *
   * @param {string|number} id
   * @returns {Promise<void>}
   */
  async identify(id) {
    if (!id || !this.#hasAnalyticsClient) return
    try {
      await this.#analyticsClient.identify(String(id), cleanObject(this.#traits))
    } catch (err) {
      logTrackerError('identify', err)
    }
  }

  /**
   * Clears queued events, traits and the underlying client state.
   */
  reset() {
    this.#events = []
    this.#traits = {}
    if (!this.#hasAnalyticsClient) return
    try {
      this.#analyticsClient.reset()
    } catch (err) {
      logTrackerError('reset', err)
    }
  }

  /**
   * Assigns traits sent with every subsequent event.
   *
   * @param {Object} traitsToAssign
   */
  assignGroupTraits(traitsToAssign) {
    if (!this.#hasAnalyticsClient) return
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
