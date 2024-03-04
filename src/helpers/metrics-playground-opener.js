import { getStaticUrlsByEnvironment } from './get-static-urls-by-environment'

export const metricsPlaygroundOpener = () => {
  const playgroundUrl = getStaticUrlsByEnvironment('playground')
  window.open(playgroundUrl, '_blank')
}
