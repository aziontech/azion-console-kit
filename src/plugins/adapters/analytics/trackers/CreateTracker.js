export class CreateTracker {
  /**
   * Interface for TrackerAdapter.
   * @typedef {Object} TrackerAdapter
   * @property {function(...args: any[]): void} addEvent - Method to add an event.
   */
  #trackerAdapter

  /**
   * Receives an instance of AnalyticsTrackerAdapter.
   * @param {import('analytics').AnalyticsInstance} adapter
   */
  constructor(adapter) {
    this.#trackerAdapter = adapter
  }

  /**
   * @param {Object} payload
   * @param {string} payload.url
   * @param {string} payload.location
   * @returns {AnalyticsTrackerAdapter}
   */
  createEventInHomeAndHeader(payload) {
    this.#trackerAdapter.addEvent({
      eventName: 'Clicked to Create',
      props: {
        url: payload.url,
        location: payload.location
      }
    })
    return this.#trackerAdapter
  }

  /**
   * @param {Object} payload
   * @param {string} payload.section
   * @param {string} payload.selection
   * @returns {AnalyticsTrackerAdapter}
   */
  selectedOnCreate(payload) {
    this.#trackerAdapter.addEvent({
      eventName: 'Selected on Create',
      props: {
        section: payload.section,
        selection: payload.selection
      }
    })
    return this.#trackerAdapter
  }

  /**
   * @returns {AnalyticsTrackerAdapter}
   */
  clickMoreDetailsOnTemplate() {
    this.#trackerAdapter.addEvent({
      eventName: 'Clicked to View More Details on Template',
      props: {}
    })
    return this.#trackerAdapter
  }

  /**
   * @returns {AnalyticsTrackerAdapter}
   */
  eventDeployed() {
    this.#trackerAdapter.addEvent({
      eventName: 'Deployed',
      props: {}
    })
    return this.#trackerAdapter
  }

  /**
   * @returns {AnalyticsTrackerAdapter}
   */
  eventFailedDeployed() {
    this.#trackerAdapter.addEvent({
      eventName: 'Failed to Deploy',
      props: {}
    })
    return this.#trackerAdapter
  }
}
