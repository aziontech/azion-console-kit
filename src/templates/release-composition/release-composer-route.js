export const RELEASE_COMPOSER_ROUTE = 'release-composer'

const SCOPED_RESOURCE_TYPES = ['application', 'firewall', 'custom_page']

/**
 * @param {{
 * resourceType?: string,
 * resourceId?: string|number,
 * version?: { id?: string|number }|null,
 * versions?: Array<{ value?: string|number }>
 * }} resourceContext the shape already built per deployable resource
 * @returns {{ name: string, query?: Record<string, string> }}
 */
export const releaseComposerRouteFromResource = (resourceContext) => {
  const scopedType = resourceContext?.resourceType
  const resourceId = resourceContext?.resourceId
  const versionId = resourceContext?.version?.id ?? resourceContext?.versions?.[0]?.value ?? null

  if (!SCOPED_RESOURCE_TYPES.includes(scopedType) || resourceId == null || versionId == null) {
    return releaseComposerRouteFromDeployment()
  }

  return {
    name: RELEASE_COMPOSER_ROUTE,
    query: {
      fromVersion: 'true',
      scopedType,
      versionId: String(versionId),
      resourceId: String(resourceId)
    }
  }
}

/**
 * Route location for opening the composer from a Deployment Setting
 * ("New Release"): DS-first, no scoped resource.
 *
 * When a Deployment Settings id is supplied (entry from a specific DS), it
 * travels in the query so the page pre-selects it on mount and the full Release
 * Composition + its inherited dependencies load immediately. Called with no id
 * (the global "Deploy" entry) it opens empty — the user picks the DS first.
 *
 * @param {string|number} [deploymentId] the originating Deployment Settings id
 * @returns {{ name: string, query?: { deploymentIds: string } }}
 */
export const releaseComposerRouteFromDeployment = (deploymentId) => {
  if (deploymentId == null || deploymentId === '') return { name: RELEASE_COMPOSER_ROUTE }
  return {
    name: RELEASE_COMPOSER_ROUTE,
    query: { deploymentIds: String(deploymentId) }
  }
}

/**
 * @param {{
 * deploymentId?: string|number,
 * scopedType?: string,
 * resourceId?: string|number,
 * versionId?: string|number
 * }} [context]
 * @returns {{ name: string, query?: Record<string, string> }}
 */
export const releaseComposerRouteFirstRelease = ({
  deploymentId,
  scopedType,
  resourceId,
  versionId
} = {}) => {
  if (deploymentId == null || deploymentId === '') return { name: RELEASE_COMPOSER_ROUTE }

  const query = { deploymentIds: String(deploymentId) }
  if (!SCOPED_RESOURCE_TYPES.includes(scopedType) || resourceId == null || versionId == null) {
    return { name: RELEASE_COMPOSER_ROUTE, query }
  }

  return {
    name: RELEASE_COMPOSER_ROUTE,
    query: {
      ...query,
      seedType: scopedType,
      seedResourceId: String(resourceId),
      seedVersionId: String(versionId)
    }
  }
}

/**
 * Route location for opening the composer from a Workload ("Deploy"). A Workload
 * may be bound to several environments — one Deployment Settings each — so the
 * entry carries EVERY bound DS id, not just the first.
 *
 * With no bound DS it opens the global "Deploy" entry; with exactly one it is the
 * single-DS Scenario A (delegates to `releaseComposerRouteFromDeployment`); with
 * more than one it carries all ids plus `pickTarget` so the composer presents the
 * Deployment Settings picker (scoped to these ids) instead of silently targeting
 * one environment.
 *
 * @param {{ deploymentIds?: Array<string|number> }} [context]
 * @returns {{ name: string, query?: Record<string, string> }}
 */
export const releaseComposerRouteFromWorkload = ({ deploymentIds } = {}) => {
  const ids = (Array.isArray(deploymentIds) ? deploymentIds : [])
    .filter((id) => id != null && id !== '')
    .map(String)

  if (ids.length <= 1) return releaseComposerRouteFromDeployment(ids[0])

  return {
    name: RELEASE_COMPOSER_ROUTE,
    query: { deploymentIds: ids.join(','), pickTarget: 'true' }
  }
}
