import { getStaticUrlsByEnvironment } from './get-static-urls-by-environment'

export const metricsPlaygroundOpener = () => {
  const playgroundUrl = getStaticUrlsByEnvironment('playgroundMetrics')
  window.open(playgroundUrl, '_blank')
}
