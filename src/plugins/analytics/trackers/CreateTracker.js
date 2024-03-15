export class CreateTracker {
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
   * @param {Object} payload
   * @param {string} payload.templateName
   * @param {string} payload.solutionId
   * @param {string} payload.version
   * @param {string} payload.versionId
   * @param {string} payload.isv
   * @param {string} payload.isvId
   * @returns {AnalyticsTrackerAdapter}
   */
  clickMoreDetailsOnTemplate(payload) {
    this.#trackerAdapter.addEvent({
      eventName: 'Clicked to View More Details on Template',
      props: {
        templateName: payload.templateName,
        solutionId: payload.solutionId,
        version: payload.version,
        versionId: payload.versionId,
        isv: payload.isv,
        isvId: payload.isvId
      }
    })
    return this.#trackerAdapter
  }

  /**
   * @returns {AnalyticsTrackerAdapter}
   * @param {Object} payload
   * @param {string} payload.templateName
   * @param {string} payload.solutionId
   * @param {string} payload.version
   * @param {string} payload.versionId
   * @param {string} payload.isv
   */
  eventDeployed(payload) {
    this.#trackerAdapter.addEvent({
      eventName: 'Deployed',
      props: {
        templateName: payload.templateName,
        solutionId: payload.solutionId,
        version: payload.version,
        versionId: payload.versionId,
        isv: payload.isv
      }
    })
    return this.#trackerAdapter
  }

  /**
   * @returns {AnalyticsTrackerAdapter}
   * @param {Object} payload
   * @param {string} payload.templateName
   * @param {string} payload.solutionId
   * @param {string} payload.version
   * @param {string} payload.versionId
   * @param {string} payload.isv
   */
  eventFailedDeployed(payload) {
    this.#trackerAdapter.addEvent({
      eventName: 'Failed to Deploy',
      props: {
        templateName: payload.templateName,
        solutionId: payload.solutionId,
        version: payload.version,
        versionId: payload.versionId,
        isv: payload.isv
      }
    })
    return this.#trackerAdapter
  }

  /**
   * @returns {AnalyticsTrackerAdapter}
   * @param {Object} payload
   * @param {string} payload.templateName
   * @param {string} payload.solutionId
   * @param {string} payload.version
   * @param {string} payload.versionId
   * @param {string} payload.isv
   */
  eventClickedToDeploy(payload) {
    this.#trackerAdapter.addEvent({
      eventName: 'Clicked to Deploy',
      props: {
        templateName: payload.templateName,
        solutionId: payload.solutionId,
        version: payload.version,
        versionId: payload.versionId,
        isv: payload.isv
      }
    })
    return this.#trackerAdapter
  }
}
