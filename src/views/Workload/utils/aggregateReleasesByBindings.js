const toTimestamp = (value) => {
  if (!value) return 0
  const time = new Date(value).getTime()
  return Number.isNaN(time) ? 0 : time
}

const byLastModifiedDesc = (left, right) => {
  const delta = toTimestamp(right.created_at) - toTimestamp(left.created_at)
  if (delta !== 0) return delta
  return String(right.id ?? '').localeCompare(String(left.id ?? ''))
}

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

  return rows.sort(byLastModifiedDesc)
}
