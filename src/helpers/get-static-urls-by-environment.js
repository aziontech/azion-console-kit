import { getEnvironment } from './get-environment'

const urls = {
  manager: {
    stage: 'https://stage-manager.azion.com',
    production: 'https://manager.azion.com'
  },
  billing: {
    stage: 'https://stage-manager.azion.com/billing-subscriptions',
    production: 'https://manager.azion.com/billing-subscriptions'
  },
  playgroundMetrics: {
    stage: 'https://stage-api.azion.com/v4/metrics/graphql',
    production: 'https://api.azion.com/v4/metrics/graphql'
  },
  playgroundEvents: {
    stage: 'https://stage-api.azion.com/v4/events/graphql',
    production: 'https://api.azion.com/v4/events/graphql'
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
