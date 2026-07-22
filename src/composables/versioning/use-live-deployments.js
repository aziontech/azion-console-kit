import { computed, toValue } from 'vue'

/**
 * @param {object} params
 * @param {import('vue').Ref | () => Map} params.activeVersions
 * @param {import('vue').Ref | () => Array} params.versions
 * @param {object} params.workloadResolver
 * @param {object} [params.resolverContext]
 */
export function useLiveDeployments({
  activeVersions,
  versions,
  workloadResolver,
  resolverContext
} = {}) {
  const liveDeployments = computed(() => {
    const map = toValue(activeVersions)
    if (!(map instanceof Map) || map.size === 0) return []

    const versionsList = toValue(versions) ?? []
    const versionById = new Map(versionsList.map((version) => [String(version?.id), version]))
    const ctx = toValue(resolverContext) ?? {}
    const resolver = toValue(workloadResolver)

    const rows = []
    for (const [versionId, entry] of map.entries()) {
      const rawDeployments = Array.isArray(entry?.deployments) ? entry.deployments : []
      if (rawDeployments.length === 0) continue

      const version = versionById.get(String(versionId)) ?? { id: versionId }
      const deployments = []
      const environments = []
      const workloads = []
      let latestDeployedAt = null
      let latestDeployedBy = null

      for (const deployment of rawDeployments) {
        const enriched = resolver?.resolve?.(deployment, ctx) ?? {}
        const environment = enriched.environment ?? null
        const workload = enriched.workload ?? null
        const deployedAt = enriched.deployedAt ?? deployment?.deployedAt ?? null
        const deployedBy = enriched.deployedBy ?? null

        deployments.push({
          id: deployment?.id ?? null,
          environment,
          workload,
          deployedAt,
          deployedBy
        })
        if (environment && !environments.includes(environment)) environments.push(environment)
        if (workload && !workloads.includes(workload)) workloads.push(workload)
        if (deployedAt && (!latestDeployedAt || deployedAt > latestDeployedAt)) {
          latestDeployedAt = deployedAt
          latestDeployedBy = deployedBy
        }
      }

      rows.push({
        versionId: String(versionId),
        version,
        deployments,
        environments,
        workloads,
        latestDeployedAt,
        latestDeployedBy
      })
    }
    return rows
  })

  return { liveDeployments }
}
