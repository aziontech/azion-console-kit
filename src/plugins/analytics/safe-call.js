import * as Sentry from '@sentry/vue'

export const safeTrackerCall = async (fn) => {
  try {
    return await fn()
  } catch (err) {
    Sentry.captureException(err)
  }
}
