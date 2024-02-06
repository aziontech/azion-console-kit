import { getEnvironmentFromUrl } from './get-environment-from-url'

export const metricsPlaygroundOpener = ({ query = null, variables = null } = {}) => {
  const environment = getEnvironmentFromUrl(window.location.href)
  const subdomain = environment === 'prod' ? 'manager' : 'stage-manager'

  const searchParams = new URLSearchParams()
  if (query) searchParams.set('query', query)
  if (query && variables) searchParams.set('variables', variables)

  window.open(`https://${subdomain}.azion.com/metrics/graphql?${searchParams}`, '_blank')
}
