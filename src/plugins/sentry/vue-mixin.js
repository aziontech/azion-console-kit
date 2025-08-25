/**
 * Vue 3 mixin to facilitate Sentry usage in components
 * @module sentry/vue-mixin
 */

import {
  captureException,
  captureMessage,
  setTags,
  setContext,
  withErrorHandling,
  initializePageContext
} from './methods.js'

/**
 * Vue 3 mixin with Sentry methods
 */
export const sentryMixin = {
  /**
   * Lifecycle hook: when component is mounted
   */
  mounted() {
    // Automatically initialize page context
    if (this.$options.name) {
      initializePageContext(this.$options.name, {
        componentProps: this.$props,
        componentData: this.$data
      })
    }
  },

  /**
   * Lifecycle hook: when component is destroyed
   */
  beforeUnmount() {
    // Clear context when component is destroyed
    if (window.$sentry) {
      window.$sentry.setTag('component', null)
      window.$sentry.setContext('component_data', null)
    }
  },

  /**
   * Lifecycle hook: captures component errors
   */
  errorCaptured(error, instance, info) {
    captureException(error, {
      component: this.$options.name || 'UnknownComponent',
      action: 'component_error',
      data: {
        errorInfo: info,
        componentStack: instance.$options.__file,
        props: this.$props,
        data: this.$data
      }
    })

    return false // Prevents error propagation
  },

  methods: {
    /**
     * Captures exception with component context
     * @param {Error} error - Error to be captured
     * @param {Object} context - Additional context
     */
    $captureException(error, context = {}) {
      captureException(error, {
        component: this.$options.name || 'UnknownComponent',
        ...context
      })
    },

    /**
     * Captures message with component context
     * @param {string} message - Message to be captured
     * @param {string} level - Message level
     * @param {Object} context - Additional context
     */
    $captureMessage(message, level = 'info', context = {}) {
      captureMessage(message, level, {
        component: this.$options.name || 'UnknownComponent',
        ...context
      })
    },

    /**
     * Sets Sentry tags
     * @param {Object} tags - Tags to be set
     */
    $setSentryTags(tags) {
      setTags({
        component: this.$options.name || 'UnknownComponent',
        ...tags
      })
    },

    /**
     * Sets Sentry context
     * @param {string} name - Context name
     * @param {Object} data - Context data
     */
    $setSentryContext(name, data) {
      setContext(name, {
        component: this.$options.name || 'UnknownComponent',
        ...data
      })
    },

    /**
     * Executes function with automatic error handling
     * @param {Function} fn - Function to be executed
     * @param {Object} context - Additional context
     * @returns {Promise} Promise with function result
     */
    $withErrorHandling(fn, context = {}) {
      return withErrorHandling(fn, {
        component: this.$options.name || 'UnknownComponent',
        ...context
      })
    },

    /**
     * Initializes page context
     * @param {string} pageName - Page name
     * @param {Object} additionalData - Additional data
     */
    $initializePageContext(pageName, additionalData = {}) {
      initializePageContext(pageName, {
        component: this.$options.name || 'UnknownComponent',
        ...additionalData
      })
    }
  }
}

/**
 * Composable for Vue 3 Composition API
 */
export function useSentry() {
  const captureException = (error, context = {}) => {
    if (window.$sentry) {
      window.$sentry.captureException(error, context)
    }
  }

  const captureMessage = (message, level = 'info', context = {}) => {
    if (window.$sentry) {
      window.$sentry.captureMessage(message, level, context)
    }
  }

  const setTag = (key, value) => {
    if (window.$sentry) {
      window.$sentry.setTag(key, value)
    }
  }

  const setContext = (name, data) => {
    if (window.$sentry) {
      window.$sentry.setContext(name, data)
    }
  }

  const withErrorHandling = async (fn, context = {}) => {
    try {
      return await fn()
    } catch (error) {
      captureException(error, context)
      throw error
    }
  }

  return {
    captureException,
    captureMessage,
    setTag,
    setContext,
    withErrorHandling
  }
}

/**
 * Vue directive to capture errors in specific elements
 */
export const sentryDirective = {
  mounted(el, binding) {
    const { value } = binding

    el.addEventListener('error', (event) => {
      captureException(new Error('Element error'), {
        component: 'SentryDirective',
        action: 'element_error',
        data: {
          element: el.tagName,
          elementId: el.id,
          elementClass: el.className,
          error: event.error,
          directiveValue: value
        }
      })
    })
  }
}

/**
 * Vue 3 plugin to register mixin and directive globally
 */
export default {
  install(app) {
    // Register mixin globally
    app.mixin(sentryMixin)

    // Register directive
    app.directive('sentry', sentryDirective)

    // Add global properties
    app.config.globalProperties.$sentryMixin = sentryMixin
    app.config.globalProperties.$useSentry = useSentry
  }
}
