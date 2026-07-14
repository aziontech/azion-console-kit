// Shared factory for per-resource workload resolvers consumed by
// useLiveDeployments in the Overview tab. A resolver enriches a raw
// deployment (from activeVersionsForResource) with the Environment /
// Workload / Deployed columns of the Live Deployments table.
//
// Default (name-based) resolver: the deployment name IS the environment
// label surfaced in the Figma. When the caller provides a
// `ctx.deploymentToWorkload` Map (built once per session by
// use-workload-directory), the resolver enriches `workload` too; otherwise
// it leaves it as null and the table renders "—".

export const createNameBasedWorkloadResolver = () => ({
  resolve(deployment, ctx = {}) {
    const directory = ctx?.deploymentToWorkload
    const workload =
      directory instanceof Map && deployment?.id != null
        ? (directory.get(String(deployment.id)) ?? null)
        : null

    return {
      environment: deployment?.name ?? null,
      workload,
      deployedAt: deployment?.deployedAt ?? null
    }
  }
})
