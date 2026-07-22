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
