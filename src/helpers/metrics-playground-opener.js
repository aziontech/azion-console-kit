import { getEnvironment } from '@/helpers'

export const metricsPlaygroundOpener = () => {
  const environment = getEnvironment()
  const subdomain = environment === 'production' ? 'manager' : 'stage-manager'

  window.open(`https://${subdomain}.azion.com/metrics/graphql`, '_blank')
}
