import { getEnvironmentFromUrl } from './get-environment-from-url'

export const metricsPlaygroundOpener = () => {
  const environment = getEnvironmentFromUrl(window.location.href)
  const subdomain = environment === 'prod' ? 'manager' : 'stage-manager'

  window.open(`https://${subdomain}.azion.com/metrics/graphql`, '_blank')
}
