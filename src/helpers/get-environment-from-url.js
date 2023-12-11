export const getEnvironmentFromUrl = (url) => {
  const stageUrls = ['stage-console', 'localhost', '127.0.0.1']
  const isStage = stageUrls.some((str) => url.includes(str))

  if (isStage) {
    return 'stage'
  }
  return 'prod'
}
