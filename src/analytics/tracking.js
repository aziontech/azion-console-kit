/**
 * Represents a generic tracking service.
 * @class
 */
export class Tracking {
  /**
   * @param {Analytics | undefined} analytics
   */
  constructor(analytics) {
    this.analytics = analytics
    this.traits = {}
  }

  /**
   * Set analytics provider. Case undefined mock the methods.
   *
   * @param {Analytics | undefined} analytics
   * @memberof Tracking
   */
  setup(analytics) {
    this.analytics = analytics
  }

  /**
   * Track page informations.
   *
   * @memberof Tracking
   */
  page() {
    this.analytics.page()
  }

  /**
   * Track event with props.
   *
   * @param {String} event
   * @param {Props} props
   * @memberof Tracking
   */
  track(event, props = {}) {
    this.analytics.track(event, { ...props, ...this.traits })
  }

  /**
   * Identify the user using the app.
   *
   * @param {String|Number} userId
   * @param {Object} traits
   * @memberof Tracking
   */
  identify(userId, traits) {
    this.analytics.identify(`${userId}`, traits)
  }

  /**
   * @param {Object} traits
   * @memberof Tracking
   */
  assignTraits(traits) {
    this.traits = traits
  }

  /**
   * Delete cookie and localStorage information of analytics.
   *
   * @memberof Tracking
   */
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
