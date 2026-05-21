import {
  SignUpTracker,
  SignInTracker,
  CreateTracker,
  ProductTracker,
  WafRulesTracker,
  RealTimeMetricsTracker,
  BillingTracker
} from './trackers'
import { cleanObject } from '../../utils/cleanObject.js'

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
  /** @type {import('analytics').AnalyticsInstance} */
  #analyticsClient = null
  /** @type {Boolean} */
  #hasAnalyticsClient = false
  #userTraits = {}
  #groupTraits = {}
  #groupId = null

  /** @type {SignUpTracker} */
  #signUpTracker = null
  /** @type {SignInTracker} */
  #signInTracker = null
  /** @type {CreateTracker} */
  #createTracker = null
  /** @type {ProductTracker} */
  #productTracker = null
  /** @type {WafRulesTracker} */
  #wafRulesTracker = null
  /** @type {RealTimeMetricsTracker} */
  #realTimeMetricsTracker = null
  /** @type {BillingTracker} */
  #billingTracker = null

  /**
   * Creates an instance of AnalyticsTrackerAdapter.
   * @param {import('analytics').AnalyticsInstance} analyticsClient - The client for tracking.
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
    this.#billingTracker = new BillingTracker(this)
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
    this.#events.forEach(async (action) => {
      const { eventName, props } = action
      const propsWithTraits = cleanObject({
        ...props,
        ...this.#userTraits,
        application: 'console-kit'
      })
      await this.#analyticsClient.track(eventName, propsWithTraits)
    })
    this.#events = []
  }

  /**
   * A method to identify a user.
   *
   * @param {string|number} id - The identifier of the user
   * @return {Promise<void>}
   */
  async identify(id) {
    if (id === undefined || id === null || id === '' || !this.#hasAnalytics()) return

    const cleanedTraits = cleanObject(this.#userTraits)
    await this.#analyticsClient.identify(String(id), cleanedTraits)
  }

  /**
   * Group call for B2B segmentation. Associates the current user with an
   * account, sending account-level traits separate from user-level traits.
   *
   * @param {string|number} groupId - Account identifier
   * @param {Object} [traits] - Account traits to attach (firmographic, tiering)
   * @return {Promise<void>}
   */
  async group(groupId, traits) {
    if (groupId === undefined || groupId === null || groupId === '' || !this.#hasAnalytics()) {
      return
    }
    if (traits) this.assignAccountTraits(groupId, traits)
    const cleaned = cleanObject(this.#groupTraits)
    await this.#analyticsClient.group(String(groupId), cleaned)
  }

  /**
   * Page view event.
   *
   * @param {string} [name] - Page name
   * @param {Object} [props] - Additional page properties
   * @return {Promise<void>}
   */
  async page(name, props = {}) {
    if (!this.#hasAnalytics()) return
    const payload = cleanObject({ ...props, ...this.#userTraits, application: 'console-kit' })
    if (name) {
      await this.#analyticsClient.page(name, payload)
    } else {
      await this.#analyticsClient.page(payload)
    }
  }

  /**
   * Resets the internal state of the tracker, including any queued events and traits.
   */
  reset() {
    this.#events = []
    this.#userTraits = {}
    this.#groupTraits = {}
    this.#groupId = null
    if (this.#hasAnalytics()) {
      this.#analyticsClient.reset()
    }
  }

  /**
   * Assigns user-level traits. Merged into every `track()` and sent on `identify()`.
   *
   * @param {Object} traitsToAssign
   */
  assignUserTraits(traitsToAssign) {
    if (!this.#hasAnalytics()) return
    if (!traitsToAssign || typeof traitsToAssign !== 'object') {
      throw new Error('Invalid traits provided')
    }
    this.#userTraits = cleanObject(traitsToAssign)
  }

  /**
   * Backward-compatible alias for assignUserTraits.
   * @deprecated prefer `assignUserTraits` or `assignAccountTraits`.
   * @param {Object} traitsToAssign
   */
  assignGroupTraits(traitsToAssign) {
    this.assignUserTraits(traitsToAssign)
  }

  /**
   * Assigns account-level (group) traits. Sent on `group()` only — NOT merged
   * into `track()` props (Segment dedupes account dims via the group).
   *
   * @param {string|number} groupId
   * @param {Object} traitsToAssign
   */
  assignAccountTraits(groupId, traitsToAssign) {
    if (!this.#hasAnalytics()) return
    if (!traitsToAssign || typeof traitsToAssign !== 'object') {
      throw new Error('Invalid traits provided')
    }
    this.#groupId = groupId
    this.#groupTraits = cleanObject(traitsToAssign)
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
   * @return {WafRulesTracker}
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

  /**
   * @return {BillingTracker}
   */
  get billing() {
    return this.#billingTracker
  }
}
