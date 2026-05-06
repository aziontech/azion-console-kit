import {
  getAzionAnonymousId,
  resetAzionAnonymousId,
  setAzionUserId,
  clearAzionUserId
} from '@/utils/cookies'

/**
 * @typedef {Object} AnalyticsClient
 * @property {(event: string, properties?: Object) => Promise<void>} track
 * @property {(userId: string|number, traits?: Object) => Promise<void>} identify
 * @property {(name?: string, properties?: Object) => Promise<void>} page
 * @property {() => void} reset
 */

const ENDPOINT = {
  track: '/signals/e',
  identify: '/signals/i',
  page: '/signals/p'
}

const log = (level, event, extra = {}) => {
  const entry = JSON.stringify({ level, tag: 'signals-client', event, ts: Date.now(), ...extra })
  if (level === 'error') {
    // eslint-disable-next-line no-console
    console.error(entry)
  } else {
    // eslint-disable-next-line no-console
    console.warn(entry)
  }
}

const post = async (path, body) => {
  if (typeof fetch === 'undefined') return
  try {
    await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      keepalive: true
    })
  } catch (networkError) {
    // Signals delivery is best-effort: log and move on so we never break the user flow.
    log('warn', 'delivery_failed', { path, msg: networkError?.message })
  }
}

/**
 * Initializes the analytics client. The write key is injected server-side by
 * the signals-proxy edge function (read from `Azion.env.get('SIGNALS_WRITE_KEY')`),
 * so the client never sees it. Bundle stays clean of secrets.
 *
 * @returns {AnalyticsClient}
 */
export function makeAnalyticsClient() {
  const buildBase = () => {
    try {
      return {
        anonymousId: getAzionAnonymousId(),
        sentAt: new Date().toISOString()
      }
    } catch (err) {
      log('warn', 'build_base_failed', { msg: err?.message })
      return { sentAt: new Date().toISOString() }
    }
  }

  return {
    async track(event, properties = {}) {
      if (!event) return
      await post(ENDPOINT.track, {
        ...buildBase(),
        event,
        properties
      })
    },

    async identify(userId, traits = {}) {
      const id = userId == null ? null : String(userId)
      if (id) setAzionUserId(id)
      await post(ENDPOINT.identify, {
        ...buildBase(),
        userId: id,
        traits
      })
    },

    async page(name, properties = {}) {
      await post(ENDPOINT.page, {
        ...buildBase(),
        name: name || undefined,
        properties
      })
    },

    reset() {
      try {
        clearAzionUserId()
        resetAzionAnonymousId()
      } catch (err) {
        log('warn', 'reset_failed', { msg: err?.message })
      }
    }
  }
}
