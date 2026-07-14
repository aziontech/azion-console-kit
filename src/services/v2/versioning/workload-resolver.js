// Shared factory for per-resource workload resolvers consumed by
// useLiveDeployments in the Overview tab. A resolver enriches a raw
// deployment (from activeVersionsForResource) with the Environment /
// Workload / Deployed columns of the Live Deployments table.
//
// Default (name-based) resolver: the deployment name IS the environment
// label surfaced in the Figma; the bound workload is not carried in
// resource_usage rows yet, so `workload` is left null and the table
// renders "—". Application and Firewall share this behavior today; a
// future resource type may look up the workload via ctx.resourceId.

export const createNameBasedWorkloadResolver = () => ({
  resolve(deployment /* , ctx = { resourceId } */) {
    return {
      environment: deployment?.name ?? null,
      workload: null,
      deployedAt: deployment?.deployedAt ?? null
    }
  }
})
