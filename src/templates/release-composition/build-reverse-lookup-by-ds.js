const isActiveWorkload = (workload) => workload?.active?.content === 'Active'

/**
 * @param {Array<{
 * id: (string|number),
 * name: *,
 * active?: { content?: string },
 * bindings?: Array<{
 * deployment_id?: (string|number|null),
 * environment_id?: (string|number|null),
 * domains?: string[]
 * }>
 * }>} workloads - The transformed workloads list (the `.body` of the v2 list response).
 * @param {Map<(string|number), string>} [envNameById]
 * @returns {{ [deploymentId: string]: Array<{
 * id: (string|number),
 * name: *,
 * domains: string[],
 * environmentId: (string|number|null),
 * environmentName: (string|null)
 * }> }} The reverse-lookup index the impact engine reads.
 */
export const buildReverseLookupByDs = (workloads, envNameById) => {
  const index = {}
  const envMap = envNameById instanceof Map ? envNameById : new Map()

  ;(Array.isArray(workloads) ? workloads : []).forEach((workload) => {
    if (!isActiveWorkload(workload)) return
    ;(Array.isArray(workload.bindings) ? workload.bindings : []).forEach((binding) => {
      const deploymentId = binding?.deployment_id
      if (deploymentId == null) return

      const environmentId = binding?.environment_id ?? null
      const row = {
        id: workload.id,
        name: workload.name?.text ?? workload.name,
        domains: Array.isArray(binding?.domains) ? binding.domains : [],
        environmentId,
        environmentName: envMap.get(environmentId) ?? null
      }

      if (!index[deploymentId]) index[deploymentId] = []
      index[deploymentId].push(row)
    })
  })

  return index
}
