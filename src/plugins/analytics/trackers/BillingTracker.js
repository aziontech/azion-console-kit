export class BillingTracker {
  #trackerAdapter

  /**
   * @param {import('../AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} adapter
   */
  constructor(adapter) {
    this.#trackerAdapter = adapter
  }

  /**
   * @param {Object} payload
   * @param {string} payload.fromPlan
   * @param {string} payload.fromCycle
   * @param {string} payload.source
   * @returns {import('../AnalyticsTrackerAdapter').AnalyticsTrackerAdapter}
   */
  planChangeInitiated(payload) {
    this.#trackerAdapter.addEvent({
      eventName: 'Plan Change Initiated',
      props: {
        fromPlan: payload?.fromPlan,
        fromCycle: payload?.fromCycle,
        source: payload?.source
      }
    })
    return this.#trackerAdapter
  }

  /**
   * @param {Object} payload
   * @param {string} payload.plan
   * @param {string} payload.billingCycle
   * @param {string} [payload.fromPlan]
   * @param {string} [payload.fromCycle]
   * @param {boolean} [payload.isCycleOnlyChange]
   */
  planSelected(payload) {
    this.#trackerAdapter.addEvent({
      eventName: 'Plan Selected',
      props: {
        plan: payload?.plan,
        billingCycle: payload?.billingCycle,
        fromPlan: payload?.fromPlan,
        fromCycle: payload?.fromCycle,
        isCycleOnlyChange: payload?.isCycleOnlyChange
      }
    })
    return this.#trackerAdapter
  }

  /**
   * @param {Object} payload
   * @param {string} payload.fromCycle
   * @param {string} payload.toCycle
   * @param {'billing'|'signup'} payload.context
   */
  billingCycleToggled(payload) {
    this.#trackerAdapter.addEvent({
      eventName: 'Billing Cycle Toggled',
      props: {
        fromCycle: payload?.fromCycle,
        toCycle: payload?.toCycle,
        context: payload?.context
      }
    })
    return this.#trackerAdapter
  }

  /**
   * @param {Object} payload
   * @param {string} payload.plan
   * @param {string} payload.billingCycle
   * @param {'subscribe'|'upgrade'|'downgrade'} [payload.mode]
   */
  checkoutStarted(payload) {
    this.#trackerAdapter.addEvent({
      eventName: 'Checkout Started',
      props: {
        plan: payload?.plan,
        billingCycle: payload?.billingCycle,
        mode: payload?.mode
      }
    })
    return this.#trackerAdapter
  }

  /**
   * @param {Object} payload
   * @param {string} payload.plan
   * @param {string} payload.billingCycle
   * @param {string} [payload.methodType]
   */
  paymentMethodSubmitted(payload) {
    this.#trackerAdapter.addEvent({
      eventName: 'Payment Method Submitted',
      props: {
        plan: payload?.plan,
        billingCycle: payload?.billingCycle,
        methodType: payload?.methodType
      }
    })
    return this.#trackerAdapter
  }

  /**
   * @param {Object} payload
   * @param {string} payload.plan
   * @param {string} payload.billingCycle
   * @param {string} [payload.fromPlan]
   * @param {string} [payload.fromCycle]
   * @param {boolean} [payload.isUpgrade]
   * @param {boolean} [payload.isDowngrade]
   */
  planChangeCompleted(payload) {
    this.#trackerAdapter.addEvent({
      eventName: 'Plan Change Completed',
      props: {
        plan: payload?.plan,
        billingCycle: payload?.billingCycle,
        fromPlan: payload?.fromPlan,
        fromCycle: payload?.fromCycle,
        isUpgrade: payload?.isUpgrade,
        isDowngrade: payload?.isDowngrade
      }
    })
    return this.#trackerAdapter
  }

  /**
   * @param {Object} payload
   * @param {string} [payload.plan]
   * @param {string} [payload.billingCycle]
   * @param {string} payload.errorType
   * @param {string} payload.errorMessage
   */
  planChangeFailed(payload) {
    this.#trackerAdapter.addEvent({
      eventName: 'Plan Change Failed',
      props: {
        plan: payload?.plan,
        billingCycle: payload?.billingCycle,
        errorType: payload?.errorType,
        errorMessage: payload?.errorMessage
      }
    })
    return this.#trackerAdapter
  }

  /**
   * @param {Object} payload
   * @param {string} payload.fromPlan
   * @param {string} payload.toPlan
   * @param {string} [payload.effectiveAt]
   * @param {string} [payload.reason]
   */
  downgradeScheduled(payload) {
    this.#trackerAdapter.addEvent({
      eventName: 'Downgrade Scheduled',
      props: {
        fromPlan: payload?.fromPlan,
        toPlan: payload?.toPlan,
        effectiveAt: payload?.effectiveAt,
        reason: payload?.reason
      }
    })
    return this.#trackerAdapter
  }

  /**
   * @param {Object} payload
   * @param {string} payload.fromPlan
   * @param {string} payload.toPlan
   */
  downgradeCancelled(payload) {
    this.#trackerAdapter.addEvent({
      eventName: 'Downgrade Cancelled',
      props: {
        fromPlan: payload?.fromPlan,
        toPlan: payload?.toPlan
      }
    })
    return this.#trackerAdapter
  }

  /**
   * @param {Object} payload
   * @param {string} payload.location
   */
  upgradeBannerClicked(payload) {
    this.#trackerAdapter.addEvent({
      eventName: 'Upgrade Banner Clicked',
      props: {
        location: payload?.location
      }
    })
    return this.#trackerAdapter
  }

  /**
   * @param {Object} payload
   * @param {string} payload.billId
   * @param {string} [payload.status]
   * @param {string|number} [payload.amount]
   */
  invoiceViewed(payload) {
    this.#trackerAdapter.addEvent({
      eventName: 'Invoice Viewed',
      props: {
        billId: payload?.billId,
        status: payload?.status,
        amount: payload?.amount
      }
    })
    return this.#trackerAdapter
  }

  /**
   * @param {Object} payload
   * @param {string} payload.billId
   * @param {string} [payload.format]
   */
  invoiceDownloaded(payload) {
    this.#trackerAdapter.addEvent({
      eventName: 'Invoice Downloaded',
      props: {
        billId: payload?.billId,
        format: payload?.format || 'pdf'
      }
    })
    return this.#trackerAdapter
  }

  /**
   * @param {Object} payload
   * @param {string} payload.methodType
   * @param {string} [payload.brand]
   */
  paymentMethodUpdated(payload) {
    this.#trackerAdapter.addEvent({
      eventName: 'Payment Method Updated',
      props: {
        methodType: payload?.methodType,
        brand: payload?.brand
      }
    })
    return this.#trackerAdapter
  }

  /**
   * @param {Object} payload
   * @param {string|number} payload.amount
   * @param {string} [payload.currency]
   */
  creditAdded(payload) {
    this.#trackerAdapter.addEvent({
      eventName: 'Credit Added',
      props: {
        amount: payload?.amount,
        currency: payload?.currency || 'USD'
      }
    })
    return this.#trackerAdapter
  }

  /**
   * @param {Object} payload
   * @param {string} payload.plan
   * @param {string} payload.billingCycle
   * @param {string|number} [payload.total]
   * @param {boolean} [payload.discountApplied]
   */
  pricingSummaryCalculated(payload) {
    this.#trackerAdapter.addEvent({
      eventName: 'Pricing Summary Calculated',
      props: {
        plan: payload?.plan,
        billingCycle: payload?.billingCycle,
        total: payload?.total,
        discountApplied: payload?.discountApplied
      }
    })
    return this.#trackerAdapter
  }
}
