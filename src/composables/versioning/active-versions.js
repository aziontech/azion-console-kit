import {
  matchesRow,
  rowResourceVersion
} from '@/services/v2/release-impact/consuming-deployments/resource-usage-match'

export const activeVersionsForResource = (rows, ref) => {
  const byVersion = new Map()
  if (!Array.isArray(rows) || !ref) return byVersion

  for (const row of rows) {
    const resources = Array.isArray(row?.resources) ? row.resources : []
    for (const rowResource of resources) {
      if (!matchesRow(rowResource, ref)) continue

      const version = rowResourceVersion(rowResource)
      if (version == null) continue

      const key = String(version)
      const entry = byVersion.get(key) ?? { deployments: [] }
      const deploymentId = row?.deployment_id ?? null

      const alreadyListed = entry.deployments.some(
        (deployment) =>
          String(deployment.id) === String(deploymentId) &&
          deployment.trafficRole === (rowResource?.traffic_role ?? null)
      )

      if (!alreadyListed) {
        entry.deployments.push({
          id: deploymentId,
          name: row?.name ?? null,
          state: row?.state ?? null,
          policy: row?.deployment_policy ?? null,
          trafficRole: rowResource?.traffic_role ?? null,
          releaseId: rowResource?.release_id ?? null
        })
      }

      byVersion.set(key, entry)
    }
  }

  return byVersion
}
