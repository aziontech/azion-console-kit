// Shared factory for per-resource workload resolvers consumed by
// useLiveDeployments in the Overview tab. A resolver enriches a raw
// deployment (from activeVersionsForResource) with the Environment /
// Workload / Deployed columns of the Live Deployments table.
//
// Names and timestamps come from the tenant-wide directories built by
// use-workload-directory (workloadsDir/envDir/metaDir), all keyed by
// deployment_id. The raw deployment payload from resource_usage only carries
// `id` and `name` — the deployment's own name is intentionally NOT used for
// the Environment column (it is the deployment's name, not the environment's).

export const createNameBasedWorkloadResolver = () => ({
  resolve(deployment, ctx = {}) {
    const workloadDir = ctx?.deploymentToWorkload
    const environmentDir = ctx?.deploymentToEnvironment
    const metaDir = ctx?.deploymentToMeta
    const key = deployment?.id != null ? String(deployment.id) : null

    const workload = key && workloadDir instanceof Map ? (workloadDir.get(key) ?? null) : null
    const environment =
      key && environmentDir instanceof Map ? (environmentDir.get(key) ?? null) : null
    const meta = key && metaDir instanceof Map ? metaDir.get(key) : null

    return {
      environment,
      workload,
      deployedAt: meta?.updatedAt ?? deployment?.deployedAt ?? null,
      deployedBy: meta?.lastModifiedBy ?? null
    }
  }
})
