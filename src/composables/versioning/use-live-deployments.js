import { computed, toValue } from 'vue'

/**
 * useLiveDeployments — flattens the `activeVersions` Map produced by
 * useActiveVersions into one row per (version, deployment) pair, enriched via a
 * per-resource workload resolver (see overview-resource-config).
 *
 * Row shape (consumed by the Live Deployments table in ResourceOverviewBlock):
 *  { versionId, version, environment, workload, deployedAt, deployment }
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
      const deployments = Array.isArray(entry?.deployments) ? entry.deployments : []
      const version = versionById.get(String(versionId)) ?? { id: versionId }

      for (const deployment of deployments) {
        const enriched = resolver?.resolve?.(deployment, ctx) ?? {}
        rows.push({
          versionId: String(versionId),
          version,
          deployment,
          environment: enriched.environment ?? null,
          workload: enriched.workload ?? null,
          deployedAt: enriched.deployedAt ?? deployment?.deployedAt ?? null
        })
      }
    }
    return rows
  })

  return { liveDeployments }
}
