export class ProductTracker {
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
   * @returns {AnalyticsTrackerAdapter}
   */
  pageLoad(payload) {
    this.#trackerAdapter.addEvent({
      eventName: 'Page Loaded',
      props: {
        url: payload.url
      }
    })
    return this.#trackerAdapter
  }

  /**
   * @param {Object} payload
   * @param {AzionProductsNames} payload.productName
   * @returns {AnalyticsTrackerAdapter}
   */
  clickToCreate(payload) {
    this.#trackerAdapter.addEvent({
      eventName: `Clicked to Create ${payload.productName}`,
      props: {}
    })
    return this.#trackerAdapter
  }

  /**
   * @param {Object} payload
   * @param {AzionProductsNames} payload.productName
   * @returns {AnalyticsTrackerAdapter}
   */
  clickToEdit(payload) {
    this.#trackerAdapter.addEvent({
      eventName: `Clicked to Edit ${payload.productName}`,
      props: {}
    })
    return this.#trackerAdapter
  }

  /**
   * @param {Object} payload
   * @param {AzionProductsNames} payload.productName
   * @returns {AnalyticsTrackerAdapter}
   */
  clickedToRealTimeMetrics({ eventName, payload }) {
    this.#trackerAdapter.addEvent({
      eventName: `Clicked ${eventName}`,
      props: {
        ...payload
      }
    })
    return this.#trackerAdapter
  }

  /**
   * @param {Object} payload
   * @param {AzionProductsNames} payload.productName
   * @param {String} payload.createdFrom
   * @param {String} payload.from
   * @param {String} payload.templateName
   * @param {String} payload.solutionId
   * @param {String} payload.version
   * @param {String} payload.versionId
   * @param {String} payload.isv
   * @param {String} payload.isvId
   * @returns {AnalyticsTrackerAdapter}
   */
  productCreated(payload) {
    this.#trackerAdapter.addEvent({
      eventName: `Created ${payload.productName}`,
      props: {
        createdFrom: payload.createdFrom,
        from: payload.from,
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
   * @param {Object} payload
   * @param {AzionProductsNames} payload.productName
   * @param {String} payload.tab
   * @returns {AnalyticsTrackerAdapter}
   */
  productEdited(payload) {
    this.#trackerAdapter.addEvent({
      eventName: `Edited ${payload.productName}`,
      props: {
        tab: payload.tab
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
   * @returns {AnalyticsTrackerAdapter}
   */
  failedToCreate(payload) {
    this.#trackerAdapter.addEvent({
      eventName: `Failed to Create ${payload.productName}`,
      props: {
        errorType: payload.errorType,
        fieldName: payload.fieldName,
        errorMessage: payload.errorMessage
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
   * @returns {AnalyticsTrackerAdapter}
   */
  failedToEdit(payload) {
    this.#trackerAdapter.addEvent({
      eventName: `Failed to Edit ${payload.productName}`,
      props: {
        errorType: payload.errorType,
        fieldName: payload.fieldName,
        errorMessage: payload.errorMessage
      }
    })
    return this.#trackerAdapter
  }

  /**
   * @param {Object} payload
   * @param {String} payload.target
   * @returns {AnalyticsTrackerAdapter}
   */
  clickedOn(payload) {
    this.#trackerAdapter.addEvent({
      eventName: `Clicked on ${payload.target}`,
      props: {}
    })
    return this.#trackerAdapter
  }
}
