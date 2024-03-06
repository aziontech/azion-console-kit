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

  /**
   * Creates an instance of AnalyticsTrackerAdapter.
   * @param {import('analytics').AnalyticsInstance} analyticsClient - The client for tracking.
   */
  constructor(analyticsClient) {
    this.#analyticsClient = analyticsClient
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
   * @returns {AnalyticsTrackerAdapter}
   */
  userSigned() {
    this.#events.push({
      eventName: 'User Signed In',
      props: {}
    })
    return this
  }

  /**
   * @returns {AnalyticsTrackerAdapter}
   */
  userFailedSignIn() {
    this.#events.push({
      eventName: 'User Failed to Sign In',
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
   * @returns {AnalyticsTrackerAdapter}
   */
  failedToEdit(payload) {
    this.#events.push({
      eventName: `Failed to Edit ${payload.productName}`,
      props: {}
    })
    return this
  }

  /**
   * @param {Object} payload
   * @param {string} payload.url
   * @param {string} payload.location
   * @returns {AnalyticsTrackerAdapter}
   */
  createEventInHomeAndHeader(payload) {
    this.#events.push({
      eventName: 'Clicked to Create',
      props: {
        url: payload.url,
        location: payload.location
      }
    })
    return this
  }

  /**
   * @returns {AnalyticsTrackerAdapter}
   */
  userSignedUp() {
    this.#events.push({
      eventName: 'User Signed Up',
      props: {}
    })
    return this
  }

  /**
   * @returns {AnalyticsTrackerAdapter}
   */
  submittedAdditionalData() {
    this.#events.push({
      eventName: 'Submitted Additional Data',
      props: {}
    })
    return this
  }

  /**
   * @returns {AnalyticsTrackerAdapter}
   */
  userFailedSignUp() {
    this.#events.push({
      eventName: 'User Failed to Sign Up',
      props: {}
    })
    return this
  }

  /**
   * @returns {AnalyticsTrackerAdapter}
   */
  failedSubmitAdditionalData() {
    this.#events.push({
      eventName: 'Failed to Submit Additional Data',
      props: {}
    })
    return this
  }

  /**
   * @param {Object} payload
   * @param {string} payload.section
   * @param {string} payload.selection
   * @returns {AnalyticsTrackerAdapter}
   */
  selectedOnCreate(payload) {
    this.#events.push({
      eventName: 'Selected on Create',
      props: {
        section: payload.section,
        selection: payload.selection
      }
    })
    return this
  }

  /**
   * @returns {AnalyticsTrackerAdapter}
   */
  clickMoreDetailsOnTemplate() {
    this.#events.push({
      eventName: 'Clicked to View More Details on Template',
      props: {}
    })
    return this
  }

  /**
   * @returns {AnalyticsTrackerAdapter}
   */
  userActivatedAccount() {
    this.#events.push({
      eventName: 'User Activated Account',
      props: {}
    })
    return this
  }

  /**
   * @returns {AnalyticsTrackerAdapter}
   */
  eventDeployed() {
    this.#events.push({
      eventName: 'Deployed',
      props: {}
    })
    return this
  }

  /**
   * @returns {AnalyticsTrackerAdapter}
   */
  eventFailedDeployed() {
    this.#events.push({
      eventName: 'Failed to Deploy',
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
