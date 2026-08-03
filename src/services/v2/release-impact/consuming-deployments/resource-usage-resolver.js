/**
 * @typedef {import('./contract').ResolveConsumingDeployments} ResolveConsumingDeployments
 * @typedef {import('./contract').ResourceRef} ResourceRef
 */

import { resourceUsageService as defaultResourceUsageService } from '@/services/v2/deployment/resource-usage-service'
import { emptyResult, normalizeResources, resourceKey } from './contract'
import { matchesRow, rowResourceVersion } from './resource-usage-match'

/**
 * @param {object} [deps]
 * @param {typeof defaultResourceUsageService} [deps.resourceUsageService]
 * @returns {ResolveConsumingDeployments}
 */
export const createResourceUsageResolver = ({
  resourceUsageService = defaultResourceUsageService
} = {}) => {
  /** @type {ResolveConsumingDeployments} */
  return async (resources) => {
    const refs = normalizeResources(resources)
    if (refs.length === 0) return emptyResult()

    const refsByType = new Map()
    for (const ref of refs) {
      const list = refsByType.get(ref.resource_type) ?? []
      list.push(ref)
      refsByType.set(ref.resource_type, list)
    }

    const settled = await Promise.allSettled(
      [...refsByType.entries()].map(async ([resourceType, typeRefs]) => ({
        typeRefs,
        response: await resourceUsageService.listResourceUsage({
          resourceType,
          resourceIds: typeRefs.map((ref) => ref.resource_id)
        })
      }))
    )

    const versionsByDs = new Map()
    const matchedByDeployment = new Map()

    for (const outcome of settled) {
      if (outcome.status !== 'fulfilled') continue
      const { typeRefs, response } = outcome.value
      const rows = Array.isArray(response?.body) ? response.body : []

      for (const row of rows) {
        const dsId = row?.deployment_id
        if (dsId == null) continue
        const rowResources = Array.isArray(row.resources) ? row.resources : []

        for (const ref of typeRefs) {
          const hit = rowResources.find((rowResource) => matchesRow(rowResource, ref))
          if (!hit) continue

          const versions = versionsByDs.get(dsId) ?? {}
          versions[resourceKey(ref)] = rowResourceVersion(hit)
          versionsByDs.set(dsId, versions)

          const matched = matchedByDeployment.get(dsId) ?? []
          if (!matched.some((entry) => resourceKey(entry) === resourceKey(ref))) {
            matched.push(ref)
          }
          matchedByDeployment.set(dsId, matched)
        }
      }
    }

    const deployments = [...versionsByDs.entries()].map(
      ([deploymentId, activeVersionByResource]) => ({ deploymentId, activeVersionByResource })
    )

    return { deployments, matchedByDeployment }
  }
}

export const resourceUsageResolver = createResourceUsageResolver()
