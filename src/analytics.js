import Analytics from 'analytics'
import segmentPlugin from '@analytics/segment'

const plugins = []

if (import.meta.env.VITE_SEGMENT_TOKEN) {
  plugins.push(
    segmentPlugin({
      writeKey: import.meta.env.VITE_SEGMENT_TOKEN
    })
  )
}

const analytics = new Analytics({ plugins })

export default analytics

export const AZION_ANALYTICS = {
  track(event, props = {}) {
    const _props = { origin: 'UI', ...props }
    analytics.track(event, { ..._props })
  },

  identify(userId, traits) {
    analytics.identify(`${userId}`, traits)
  },

  page() {
    analytics.page()
  },

  reset() {
    analytics.reset()
  }
}
