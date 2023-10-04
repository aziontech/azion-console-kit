export class AzionAnalytics {
  constructor(analytics) {
    this.analytics = analytics
  }

  track(event, props = {}) {
    const _props = { origin: 'UI', ...props }
    this.analytics.track(event, { ..._props })
  }

  identify(userId, traits) {
    this.analytics.identify(`${userId}`, traits)
  }

  page() {
    this.analytics.page()
  }

  reset() {
    this.analytics.reset()
  }
}
