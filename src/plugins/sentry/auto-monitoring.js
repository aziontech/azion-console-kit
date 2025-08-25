/**
 * Automatic Sentry monitoring system
 * @module sentry/auto-monitoring
 */

import { captureException, setTags, setContext } from './methods.js'

/**
 * Monitors unhandled JavaScript errors
 */
export function monitorJavaScriptErrors() {
  if (typeof window === 'undefined') return

  // Monitor unhandled JavaScript errors
  window.addEventListener('error', (event) => {
    captureException(event.error || new Error(event.message), {
      component: 'GlobalErrorHandler',
      action: 'uncaught_error',
      data: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      }
    })
  })

  // Monitor unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    captureException(new Error(event.reason), {
      component: 'GlobalErrorHandler',
      action: 'unhandled_promise',
      data: {
        reason: event.reason,
        promise: event.promise
      }
    })
  })
}

/**
 * Monitors route changes
 * @param {Object} router - Vue Router instance
 */
export function monitorRouter(router) {
  router.beforeEach((to, from, next) => {
    setTags({
      route: to.name,
      fromRoute: from.name,
      path: to.path
    })

    setContext('navigation', {
      to: to.path,
      from: from.path,
      timestamp: new Date().toISOString()
    })

    next()
  })

  router.onError((error) => {
    captureException(error, {
      component: 'RouterMonitor',
      action: 'route_error',
      data: {
        currentRoute: router.currentRoute.value.path
      }
    })
  })
}

/**
 * Initializes automatic monitoring system based on environment
 * @param {Object} router - Vue Router instance
 */
export function initializeAutoMonitoring(router) {
  // Always monitor JavaScript errors
  monitorJavaScriptErrors()

  // Always monitor routes
  monitorRouter(router)
}
