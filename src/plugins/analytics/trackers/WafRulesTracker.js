export class WafRulesTracker {
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
   * @param {Object} payload
   * @param {'drawer'|'page'} payload.origin
   *
   * @returns {AnalyticsTrackerAdapter}
   */
  clickedToAllowRules(payload) {
    this.#trackerAdapter.addEvent({
      eventName: 'Clicked to Allow Rules',
      props: {
        origin: payload.origin
      }
    })
    return this.#trackerAdapter
  }

  /**
   * @param {Object} payload
   * @param {'drawer'|'page'} payload.origin
   *
   * @returns {AnalyticsTrackerAdapter}
   */
  allowedRules(payload) {
    this.#trackerAdapter.addEvent({
      eventName: 'Allowed Rules',
      props: {
        origin: payload.origin
      }
    })
    return this.#trackerAdapter
  }

  /**
   * @param {Object} payload
   * @param {AzionProductsNames} payload.productName
   * @param {String} payload.errorType
   * @param {String} payload.fieldName
   * @param {String} payload.errorMessage
   * @param {'drawer'|'page'} payload.origin
   * @returns {AnalyticsTrackerAdapter}
   */
  failedToAllowRules(payload) {
    this.#trackerAdapter.addEvent({
      eventName: 'Failed to Allow Rules',
      props: {
        errorType: payload.errorType,
        fieldName: payload.fieldName,
        errorMessage: payload.errorMessage,
        origin: payload.origin
      }
    })
    return this.#trackerAdapter
  }
}
