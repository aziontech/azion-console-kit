export class RealTimeMetricsTracker {
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
 * @param {AzionProductsNames} payload.productName
 * @returns {AnalyticsTrackerAdapter}
 */
  clickedToRealTimeMetrics({ eventName, payload }) {
    this.#trackerAdapter.addEvent({
      eventName,
      props: {
        ...payload
      }
    })
    return this.#trackerAdapter
  }
}
