import { computed, toValue } from 'vue'

/**
 * useLiveDeployments — aggregates the `activeVersions` Map produced by
 * useActiveVersions into ONE row per version, listing every deployment the
 * version is currently pinned to. Each deployment is enriched via the shared
 * workload resolver (see overview-resource-config).
 *
 * Row shape (consumed by the Live Deployments table in ResourceOverviewBlock):
 *   {
 *     versionId,
 *     version,                                   // raw version object from listVersions
 *     deployments: Array<{                       // one entry per active deployment
 *       id, environment, workload, deployedAt
 *     }>,
 *     environments: string[],                    // unique env names, ordered by first occurrence
 *     workloads: string[],                       // unique workload names, ordered
 *     latestDeployedAt: string | null            // most recent deployedAt across deployments
 *   }
 *
 * @param {object} params
 * @param {import('vue').Ref | () => Map} params.activeVersions — Map<versionId, {deployments}>
 * @param {import('vue').Ref | () => Array} params.versions — raw versions array (for label enrichment)
 * @param {object} params.workloadResolver — { resolve(deployment, ctx) → {environment,workload,deployedAt} }
 * @param {object} [params.resolverContext] — passed to workloadResolver.resolve (e.g. { resourceId })
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
    // Resolver may arrive as a plain object OR a ref/computed — unwrap so
    // `resolve(...)` is always the concrete function, never a wrapped ref.
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

      for (const deployment of rawDeployments) {
        const enriched = resolver?.resolve?.(deployment, ctx) ?? {}
        const environment = enriched.environment ?? null
        const workload = enriched.workload ?? null
        const deployedAt = enriched.deployedAt ?? deployment?.deployedAt ?? null

        deployments.push({ id: deployment?.id ?? null, environment, workload, deployedAt })
        if (environment && !environments.includes(environment)) environments.push(environment)
        if (workload && !workloads.includes(workload)) workloads.push(workload)
        if (deployedAt && (!latestDeployedAt || deployedAt > latestDeployedAt)) {
          latestDeployedAt = deployedAt
        }
      }

      rows.push({
        versionId: String(versionId),
        version,
        deployments,
        environments,
        workloads,
        latestDeployedAt
      })
    }
    return rows
  })

  return { liveDeployments }
}
