const FAKE_ANALYTICS = {
  track: () => {},
  identify: () => {},
  page: () => {},
  assignTraits: () => {},
  reset: () => {}
}

/**
 * Represents a generic tracking service.
 * @class
 */
export class Tracking {
  /**
   * @param {Analytics} analytics
   */
  constructor(analytics) {
    this.analytics = analytics || FAKE_ANALYTICS
    this.traits = {}
  }

  /**
   * Set analytics provider. Case undefined mock the methods.
   * @param {Analytics|undefined} analytics
   */
  setup(analytics) {
    this.analytics = analytics || FAKE_ANALYTICS
  }

  /**
   * Track page informations.
   */
  page() {
    this.analytics.page()
  }

  /**
   * Track event with props.
   * @param {String} event
   * @param {Props} props
   */
  track(event, props = {}) {
    this.analytics.track(event, { ...props, ...this.traits })
  }

  identify(userId, traits) {
    this.analytics.identify(`${userId}`, traits)
  }

  assignTraits(traits) {
    this.traits = traits
  }

  reset() {
    this.analytics.reset()
  }
}

export const TrackClickDirective = (tracking) => ({
  mounted(el, { value = {}, arg = '' }) {
    const { action, page, props } = value

    let component = ''
    component = arg === 'button' ? 'Button' : ''
    component = arg === 'link' ? 'Link' : ''

    const handleClick = () => {
      tracking.track(`Click ${component}: ${action} on ${page}`, props)
    }

    el.addEventListener('click', handleClick)

    el.disableDirective = () => {
      el.removeEventListener('click', handleClick)
    }
  },
  unmounted(el) {
    if (!el) {
      return
    }
    el.disableDirective()
  }
})
