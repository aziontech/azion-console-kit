/**
 * Filters and security configurations for Sentry
 * @module sentry/filters
 */

import { securityConfig } from './config.js'

/**
 * Filters sensitive breadcrumbs before sending to Sentry
 * @param {Object} breadcrumb - Breadcrumb to be filtered
 * @returns {Object|null} Filtered breadcrumb or null if should be removed
 */
export function filterBreadcrumb(breadcrumb) {
  // Remove breadcrumbs from sensitive requests
  if (breadcrumb.category === 'fetch' && breadcrumb.data) {
    const url = breadcrumb.data.url
    if (url && securityConfig.sensitiveUrls.some((sensitiveUrl) => url.includes(sensitiveUrl))) {
      return null
    }
  }

  // Remove breadcrumbs from navigation to sensitive pages
  if (breadcrumb.category === 'navigation' && breadcrumb.data) {
    const url = breadcrumb.data.from || breadcrumb.data.to
    if (url && securityConfig.sensitiveUrls.some((sensitiveUrl) => url.includes(sensitiveUrl))) {
      return null
    }
  }

  return breadcrumb
}

/**
 * Filters events before sending to Sentry
 * @param {Object} event - Event to be filtered
 * @returns {Object|null} Filtered event or null if should be ignored
 */
export function filterEvent(event) {
  // Filter common network errors
  if (event.exception) {
    const exception = event.exception.values?.[0]
    if (exception?.type && securityConfig.ignoredErrors.includes(exception.type)) {
      return null
    }

    if (
      exception?.value &&
      securityConfig.ignoredErrors.some((error) => exception.value.includes(error))
    ) {
      return null
    }
  }

  // Remove sensitive information from context
  if (event.contexts) {
    // Remove sensitive data from user context
    if (event.contexts.user) {
      delete event.contexts.user.password
      delete event.contexts.user.token
      delete event.contexts.user.secret
    }

    // Remove sensitive data from request context
    if (event.contexts.request) {
      if (event.contexts.request.headers) {
        delete event.contexts.request.headers.authorization
        delete event.contexts.request.headers.cookie
        delete event.contexts.request.headers['x-api-key']
      }

      if (event.contexts.request.data) {
        delete event.contexts.request.data.password
        delete event.contexts.request.data.token
        delete event.contexts.request.data.secret
      }
    }
  }

  // Remove sensitive data from breadcrumbs
  if (event.breadcrumbs) {
    event.breadcrumbs = event.breadcrumbs.map((breadcrumb) => {
      if (breadcrumb.data) {
        // Remove sensitive data from breadcrumbs
        delete breadcrumb.data.password
        delete breadcrumb.data.token
        delete breadcrumb.data.secret
        delete breadcrumb.data.authorization
      }
      return breadcrumb
    })
  }

  return event
}

/**
 * Adds additional context to the event
 * @param {Object} event - Sentry event
 * @param {string} environment - Application environment
 * @returns {Object} Event with additional context
 */
export function addEventContext(event, environment) {
  // Add default tags
  event.tags = {
    ...event.tags,
    environment,
    version: import.meta.env.VITE_APP_VERSION || 'unknown',
    timestamp: new Date().toISOString()
  }

  // Add browser context
  if (typeof window !== 'undefined') {
    event.contexts = {
      ...event.contexts,
      browser: {
        name: navigator.userAgent,
        version: navigator.appVersion,
        url: window.location.href
      }
    }
  }

  return event
}

/**
 * Creates custom filter function for Sentry
 * @param {string} environment - Application environment
 * @returns {Function} Filter function for Sentry
 */
export function createBeforeSendFilter(environment) {
  return (event) => {
    // Apply security filters
    const filteredEvent = filterEvent(event)
    if (!filteredEvent) {
      return null
    }

    // Add additional context
    return addEventContext(filteredEvent, environment)
  }
}

/**
 * Creates breadcrumb filter function for Sentry
 * @returns {Function} Breadcrumb filter function
 */
export function createBeforeBreadcrumbFilter() {
  return (breadcrumb) => {
    return filterBreadcrumb(breadcrumb)
  }
}
