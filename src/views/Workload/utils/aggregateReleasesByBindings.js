export const aggregateReleasesByBindings = ({ releasesByDeployment, deploymentNameById } = {}) => {
  const releasesMap = releasesByDeployment instanceof Map ? releasesByDeployment : new Map()
  const nameById = deploymentNameById instanceof Map ? deploymentNameById : new Map()

  const rows = []

  for (const [deploymentId, releases] of releasesMap) {
    if (!Array.isArray(releases)) continue

    const key = String(deploymentId)
    const deploymentName = nameById.get(key) ?? key

    for (const release of releases) {
      if (!release) continue
      rows.push({
        ...release,
        deployment_id: deploymentId,
        deploymentName
      })
    }
  }

  return rows
}
