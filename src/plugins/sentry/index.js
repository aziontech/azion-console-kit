/**
 * Sentry Plugin Export
 * Centralized export for Sentry configuration and feedback functionality
 */

import SentryPlugin from './SentryPlugin.js'

export default SentryPlugin

// Export individual methods for direct usage if needed
export const createFeedbackForm = (sentryInstance, options = {}) => {
  return sentryInstance.createFeedbackForm(options)
}

export const applyModalStyles = (sentryInstance, element) => {
  return sentryInstance.applyModalStyles(element)
}

export const findAndStyleFeedbackModal = (sentryInstance) => {
  return sentryInstance.findAndStyleFeedbackModal()
}
