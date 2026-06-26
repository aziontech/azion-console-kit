// Surface-agnostic pure inversion of the v6 workloads list into the per-DS
// impact index (`reverseLookupByDs`) that the existing impact engine
// (`buildDsImpact` in use-release-composition.js) consumes unchanged. Lives in a
// neutral module — no Vue, no IO; it receives the workloads list and the
// environment-name map and returns plain data (design §3.2).
//
// Contract it encodes (the single unit that owns these rules, req 3.2/3.3/7.3):
//  - active-only: a workload contributes only when `active.content === 'Active'`
//    (disabled workloads are excluded from the blast radius).
//  - guaranteed binding fields only: it reads `deployment_id`, `environment_id`
//    and `domains[]` and nothing else — never `certificate`/`auto_domain`, which
//    the list response does not guarantee.
//  - no fabrication: `environmentName` is whatever the map yields, or `null`;
//    `domains` defaults to `[]`. It never invents a name or a count.

const isActiveWorkload = (workload) => workload?.active?.content === 'Active'

/**
 * Invert a workloads list into the per-deployment index keyed by `deployment_id`.
 *
 * For every ACTIVE workload, each binding with a non-null `deployment_id` emits a
 * row under that deployment id. Bindings without a `deployment_id` are not
 * attributable to any DS and are skipped (req 3.2).
 *
 * @param {Array<{
 *   id: (string|number),
 *   name: *,
 *   active?: { content?: string },
 *   bindings?: Array<{
 *     deployment_id?: (string|number|null),
 *     environment_id?: (string|number|null),
 *     domains?: string[]
 *   }>
 * }>} workloads - The transformed workloads list (the `.body` of the v2 list response).
 * @param {Map<(string|number), string>} [envNameById] - `Map<environment_id, environment_name>`
 *   from HOP 3; an absent id resolves to a null name (never fabricated, req 4.2/7.3).
 * @returns {{ [deploymentId: string]: Array<{
 *   id: (string|number),
 *   name: *,
 *   domains: string[],
 *   environmentId: (string|number|null),
 *   environmentName: (string|null)
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
        name: workload.name,
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
