import { createResourceUsageResolver } from './resource-usage-resolver'
import { createFanoutResolver } from './fanout-resolver'

/**
 * @param {object} [deps]
 * @returns {import('./contract').ResolveConsumingDeployments}
 */
export const selectResolver = (deps) => {
  const primary = createResourceUsageResolver(deps)
  const fallback = createFanoutResolver(deps)
  return async (resources) => {
    let primaryResult = null
    try {
      primaryResult = await primary(resources)
    } catch {
      primaryResult = null
    }
    if (primaryResult && primaryResult.deployments.length > 0) {
      return primaryResult
    }
    return fallback(resources)
  }
}

/**
 * @param {import('./contract').ResourceRef|import('./contract').ResourceRef[]} resources
 * @param {object} [deps]
 * @returns {Promise<import('./contract').ConsumingDeploymentsResult>}
 */
export const resolveConsumingDeployments = (resources, deps) => selectResolver(deps)(resources)

export {
  APPLICATION_RESOURCE_TYPE,
  resourceKey,
  matchIdValue,
  normalizeResources,
  emptyResult,
  assertConsumingDeploymentsShape
} from './contract'

export { createFanoutResolver, fanoutResolver, FANOUT_PRESELECT_DS_CAP } from './fanout-resolver'
export { createResourceUsageResolver, resourceUsageResolver } from './resource-usage-resolver'
