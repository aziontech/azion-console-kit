/**
 * Simplified utility methods for Sentry
 * @module sentry/methods
 */

/**
 * Sets user context in Sentry
 * @param {Object} user - User data
 */
export function setUserContext(user) {
  if (window.$sentry && user) {
    window.$sentry.setUser({
      id: user.user_id,
      email: user.email,
      account_id: user.id,
      account_name: user.name,
      account_type: user.kind,
      account_status: user.status
    })
  }
}
