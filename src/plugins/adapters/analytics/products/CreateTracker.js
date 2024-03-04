export class CreateTracker {
  #adapter

  constructor(adapter) {
    this.#adapter = adapter
  }

  /**
   * @param {Object} payload
   * @param {string} payload.url
   * @param {string} payload.location
   * @returns {AnalyticsTrackerAdapter}
   */
  createEventInHomeAndHeader(payload) {
    this.#adapter.addEvent({
      eventName: 'Clicked to Create',
      props: {
        url: payload.url,
        location: payload.location
      }
    })
    return this.#adapter
  }

  /**
   * @param {Object} payload
   * @param {string} payload.section
   * @param {string} payload.selection
   * @returns {AnalyticsTrackerAdapter}
   */
  selectedOnCreate(payload) {
    this.#adapter.addEvent({
      eventName: 'Selected on Create',
      props: {
        section: payload.section,
        selection: payload.selection
      }
    })
    return this.#adapter
  }

  /**
   * @returns {AnalyticsTrackerAdapter}
   */
  clickMoreDetailsOnTemplate() {
    this.#adapter.addEvent({
      eventName: 'Clicked to View More Details on Template',
      props: {}
    })
    return this.#adapter
  }

  /**
   * @returns {AnalyticsTrackerAdapter}
   */
  eventDeployed() {
    this.#adapter.addEvent({
      eventName: 'Deployed',
      props: {}
    })
    return this.#adapter
  }

  /**
   * @returns {AnalyticsTrackerAdapter}
   */
  eventFailedDeployed() {
    this.#adapter.addEvent({
      eventName: 'Failed to Deploy',
      props: {}
    })
    return this.#adapter
  }
}
