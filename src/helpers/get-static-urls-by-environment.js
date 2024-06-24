import { getEnvironment } from './get-environment'

const urls = {
  manager: {
    stage: 'https://stage-manager.azion.com',
    production: 'https://manager.azion.com'
  },
  billing: {
    stage:
      'https://stage-manager.azion.com/billing-subscriptions/payment-methods?active_tab=payment_methods',
    production:
      'https://manager.azion.com/billing-subscriptions/payment-methods?active_tab=payment_methods'
  },
  playground: {
    stage: 'https://stage-manager.azion.com/metrics/graphql',
    production: 'https://manager.azion.com/metrics/graphql'
  },
  helpCenter: {
    stage: 'https://storage.googleapis.com/gcs-docs-help-center-stage/console/',
    production: 'https://storage.googleapis.com/gcs-docs-help-center/console/'
  }
}

/**
 * Retrieves static URLs based on the current environment.
 *
 * @param {string} section - The section for which to retrieve the static URLs.
 * Valid values are 'manager', 'billing', 'playground', 'helpCenter'.
 * @return {string | undefined} The static URL for the given section in the current environment.
 */
export const getStaticUrlsByEnvironment = (section) => {
  if (!urls[section]) {
    return
  }

  const environment = getEnvironment()
  return urls[section][environment] || urls[section].stage
}
