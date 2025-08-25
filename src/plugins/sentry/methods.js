/**
 * Utility methods for Sentry
 * @module sentry/methods
 */

/**
 * Sets user context in Sentry
 * @param {Object} user - User data
 * @param {string} user.user_id - User ID
 * @param {string} user.email - User email
 * @param {string} user.id - Account ID
 * @param {string} user.name - Account name
 * @param {string} user.kind - Account type
 * @param {string} user.status - Account status
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

/**
 * Captures an exception in Sentry
 * @param {Error} error - Error to be captured
 * @param {Object} context - Additional context
 * @param {string} context.component - Component name
 * @param {string} context.action - Action that caused the error
 * @param {Object} context.data - Data related to the error
 */
export function captureException(error, context = {}) {
  if (window.$sentry) {
    // Add component context
    if (context.component) {
      window.$sentry.setTag('component', context.component)
    }

    if (context.action) {
      window.$sentry.setTag('action', context.action)
    }

    if (context.data) {
      window.$sentry.setContext('error_data', context.data)
    }

    window.$sentry.captureException(error)
  } else {
    // eslint-disable-next-line no-console
    console.error('Sentry not available:', error, context)
  }
}

/**
 * Captures a message in Sentry
 * @param {string} message - Message to be captured
 * @param {string} level - Message level (info, warning, error)
 * @param {Object} context - Additional context
 * @param {string} context.component - Component name
 * @param {string} context.action - Related action
 * @param {Object} context.data - Related data
 */
export function captureMessage(message, level = 'info', context = {}) {
  if (window.$sentry) {
    if (context.component) {
      window.$sentry.setTag('component', context.component)
    }

    if (context.action) {
      window.$sentry.setTag('action', context.action)
    }

    if (context.data) {
      window.$sentry.setContext('message_data', context.data)
    }

    window.$sentry.captureMessage(message, level)
  } else {
    // eslint-disable-next-line no-console
    console.log(`[${level.toUpperCase()}] ${message}`, context)
  }
}

/**
 * Sets custom tags in Sentry
 * @param {Object} tags - Tags to be set
 */
export function setTags(tags) {
  if (window.$sentry) {
    Object.entries(tags).forEach(([key, value]) => {
      window.$sentry.setTag(key, value)
    })
  }
}

/**
 * Sets custom context in Sentry
 * @param {string} name - Context name
 * @param {Object} data - Context data
 */
export function setContext(name, data) {
  if (window.$sentry) {
    window.$sentry.setContext(name, data)
  }
}

/**
 * Wrapper for functions that may generate errors
 * @param {Function} fn - Function to be executed
 * @param {Object} context - Context for Sentry
 * @param {string} context.component - Component name
 * @param {string} context.action - Action being executed
 * @returns {Promise} Promise with function result
 */
export async function withErrorHandling(fn, context = {}) {
  try {
    return await fn()
  } catch (error) {
    captureException(error, context)
    throw error
  }
}

/**
 * Checks if Sentry is available
 * @returns {boolean} True if Sentry is available
 */
export function isSentryAvailable() {
  return !!window.$sentry
}

/**
 * Initializes page context in Sentry
 * @param {string} pageName - Page name
 * @param {Object} additionalData - Additional data
 */
export function initializePageContext(pageName, additionalData = {}) {
  if (window.$sentry) {
    setTags({
      page: pageName,
      url: window.location.href
    })

    setContext('page_info', {
      name: pageName,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      ...additionalData
    })
  }
}
