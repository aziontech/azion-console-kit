/**
 * Default Sentry plugin for Vue 3
 * @module sentry
 */

import * as Sentry from '@sentry/vue'
import { getSentryConfig } from './config.js'

export default {
  install(app, options = {}) {
    const { router = null } = options

    const config = getSentryConfig({
      app,
      sendDefaultPii: true,
      enableLogs: true,
      beforeSend(event, hint) {
        const exception = hint?.originalException

        if (typeof exception === 'string') {
          event.exception = {
            values: [
              {
                type: 'NonErrorException',
                value: exception || '<empty string>'
              }
            ]
          }
          event.tags = { ...event.tags, nonErrorException: true }
        }

        return event
      },
      integrations: [
        ...(router ? [Sentry.browserTracingIntegration({ router })] : []),

        Sentry.replayIntegration({
          maskAllText: false,
          blockAllMedia: false,
          mask: [
            '[data-sentry-mask]',
            'input[type="password"]',
            'textarea[type="password"]',
            'input[name*="hmacAccessKey"]',
            'input[name*="hmacSecretKey"]',
            'div[data-sentry-mask] input'
          ],
          unmask: ['[data-sentry-unmask]'],
          slowClickIgnoreSelectors: [
            '.p-button',
            '.p-row-toggler',
            '.p-menuitem-link',
            '.p-tabview-nav-link',
            '.p-paginator-page',
            '.p-checkbox',
            '.p-radiobutton',
            'a[download]',
            'a[target="_blank"]'
          ]
        })
      ]
    })

    Sentry.init(config)

    app.config.globalProperties.$sentry = {
      captureException: Sentry.captureException,
      captureMessage: Sentry.captureMessage,
      setUser: Sentry.setUser,
      setTag: Sentry.setTag,
      setContext: Sentry.setContext
    }
  }
}
