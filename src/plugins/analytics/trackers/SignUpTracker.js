export class SignUpTracker {
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
   * @param {'google'|'azure'|'github'|'email'} payload.method
   *
   * @returns {AnalyticsTrackerAdapter}
   */
  userSignedUp(payload) {
    this.#trackerAdapter.addEvent({
      eventName: 'User Signed Up',
      props: {
        method: payload.method
      }
    })
    return this.#trackerAdapter
  }

  /**
   * @param {Object} payload
   * @param {'google'|'azure'|'github'|'email'} payload.method
   *
   * @returns {AnalyticsTrackerAdapter}
   */
  userClickedSignedUp(payload) {
    this.#trackerAdapter.addEvent({
      eventName: 'User Clicked to Sign Up',
      props: {
        method: payload.method
      }
    })
    return this.#trackerAdapter
  }

  /**
   * @param {Object} payload
   * @param {'google'|'azure'|'github'} payload.method
   *
   * @returns {AnalyticsTrackerAdapter}
   */
  userAuthorizedSso(payload) {
    this.#trackerAdapter.addEvent({
      eventName: 'User Authorized SSO',
      props: {
        method: payload.method
      }
    })
    return this.#trackerAdapter
  }

  /**
   * @param {Object} payload
   * @param {'api'|'field'} payload.errorType
   * @param {string} payload.fieldName
   * @param {string} payload.errorMessage
   *
   * @returns {AnalyticsTrackerAdapter}
   */
  userFailedSignUp(payload) {
    this.#trackerAdapter.addEvent({
      eventName: 'User Failed to Sign Up',
      props: {
        errorType: payload.errorType,
        fieldName: payload.fieldName,
        errorMessage: payload.errorMessage
      }
    })
    return this.#trackerAdapter
  }

  /**
   * @returns {AnalyticsTrackerAdapter}
   */
  submittedAdditionalData(payload) {
    this.#trackerAdapter.addEvent({
      eventName: 'Submitted Additional Data',
      props: {
        use: payload.use,
        role: payload.role,
        inputRole: payload.inputRole,
        companySize: payload.companySize,
        onboardingSchedule: payload.onboardingSession,
        website: payload.companyWebsite,
        name: payload.fullName
      }
    })
    return this.#trackerAdapter
  }

  /**
   * @returns {AnalyticsTrackerAdapter}
   */
  failedSubmitAdditionalData(payload) {
    this.#trackerAdapter.addEvent({
      eventName: 'Failed to Submit Additional Data',
      props: {
        errorType: payload.errorType,
        errorMessage: payload.errorMessage,
        fieldName: payload.fieldName
      }
    })
    return this.#trackerAdapter
  }

  /**
   * @returns {AnalyticsTrackerAdapter}
   */
  userActivatedAccount() {
    this.#trackerAdapter.addEvent({
      eventName: 'User Activated Account',
      props: {}
    })
    return this.#trackerAdapter
  }

  /**
   * @param {Object} payload
   * @param {'hobby'|'pro'} payload.plan
   *
   * @returns {AnalyticsTrackerAdapter}
   */
  successScreenViewed(payload) {
    this.#trackerAdapter.addEvent({
      eventName: 'Sign Up Success Screen Viewed',
      props: {
        plan: payload.plan
      }
    })
    return this.#trackerAdapter
  }

  /**
   * @param {Object} payload
   * @param {'hobby'|'pro'} payload.plan
   *
   * @returns {AnalyticsTrackerAdapter}
   */
  startDeployingClicked(payload) {
    this.#trackerAdapter.addEvent({
      eventName: 'Sign Up Start Deploying Clicked',
      props: {
        plan: payload.plan
      }
    })
    return this.#trackerAdapter
  }

  /**
   * @param {Object} payload
   * @param {string} payload.plan
   * @param {string} payload.billingCycle
   */
  planSelected(payload) {
    this.#trackerAdapter.addEvent({
      eventName: 'Sign Up Plan Selected',
      props: {
        plan: payload?.plan,
        billingCycle: payload?.billingCycle
      }
    })
    return this.#trackerAdapter
  }

  /**
   * @param {Object} payload
   * @param {string} payload.fromCycle
   * @param {string} payload.toCycle
   */
  billingCycleToggled(payload) {
    this.#trackerAdapter.addEvent({
      eventName: 'Sign Up Billing Cycle Toggled',
      props: {
        fromCycle: payload?.fromCycle,
        toCycle: payload?.toCycle
      }
    })
    return this.#trackerAdapter
  }

  /**
   * @param {Object} payload
   * @param {string} payload.plan
   * @param {string} payload.billingCycle
   */
  checkoutStarted(payload) {
    this.#trackerAdapter.addEvent({
      eventName: 'Sign Up Checkout Started',
      props: {
        plan: payload?.plan,
        billingCycle: payload?.billingCycle
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
      eventName: 'Sign Up Payment Method Submitted',
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
   * @param {string|number} [payload.amount]
   * @param {string} [payload.currency]
   */
  paymentConfirmed(payload) {
    this.#trackerAdapter.addEvent({
      eventName: 'Sign Up Payment Confirmed',
      props: {
        plan: payload?.plan,
        billingCycle: payload?.billingCycle,
        amount: payload?.amount,
        currency: payload?.currency
      }
    })
    return this.#trackerAdapter
  }

  /**
   * @param {Object} payload
   * @param {string} payload.errorType
   * @param {string} payload.errorMessage
   * @param {string} [payload.gateway]
   */
  paymentFailed(payload) {
    this.#trackerAdapter.addEvent({
      eventName: 'Sign Up Payment Failed',
      props: {
        errorType: payload?.errorType,
        errorMessage: payload?.errorMessage,
        gateway: payload?.gateway
      }
    })
    return this.#trackerAdapter
  }

  /**
   * @param {Object} payload
   * @param {'email'|'resend'} payload.source
   */
  emailVerificationClicked(payload) {
    this.#trackerAdapter.addEvent({
      eventName: 'Email Verification Clicked',
      props: {
        source: payload?.source
      }
    })
    return this.#trackerAdapter
  }
}
