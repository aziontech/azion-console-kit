// Surface-agnostic entry helpers for the full-page Review & deploy screen
// (route `release-composer`, path `releases/new`). Lives in the neutral
// release-composition module so entry code never imports from a "drawer"-named
// file. Pure: builds a Vue Router location from the inputs; the host pushes it.
//
// The page reads these on mount and calls `store.openRelease` (spec §A). Only
// what the spec lists is passed in the query; `consumingDsIds` is intentionally
// omitted — the page resolves the consuming Deployment Settings client-side.

export const RELEASE_COMPOSER_ROUTE = 'release-composer'

// scopedType is the resource kind the composer scopes to. The composer accepts
// `application` | `firewall` | `custom_page`; other resource kinds open DS-first.
const SCOPED_RESOURCE_TYPES = ['application', 'firewall', 'custom_page']

/**
 * Route location for opening the composer scoped to a specific resource version
 * ("Deploy <version>"). The composer pre-selects the consuming Deployment
 * Settings itself, so no DS ids travel in the query.
 *
 * Resolves the version id from a pinned version, else the first deployable
 * option. Returns the plain DS-first location when the inputs can't form a
 * resource-scoped entry (unknown type or missing id) — never fabricates state.
 *
 * @param {{
 *   resourceType?: string,
 *   resourceId?: string|number,
 *   version?: { id?: string|number }|null,
 *   versions?: Array<{ value?: string|number }>
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
 * Route location for the "Compose first release" CTA: a Deployment Settings
 * reached from a resource-scoped entry that has no active release to override.
 * Opens the composer DS-first (full composition, Application editable) for that
 * single DS and carries the scoped resource forward as a seed so the resource +
 * version the user came from arrive pre-filled — only the Application is left to
 * pick.
 *
 * The seed travels under `seed*` keys (not `scopedType`/`fromVersion`) so it does
 * NOT collapse the composition to a scoped entry. Falls back to the plain
 * DS-first location when the seed can't be formed (unknown type or missing id) —
 * never fabricates state.
 *
 * @param {{
 *   deploymentId?: string|number,
 *   scopedType?: string,
 *   resourceId?: string|number,
 *   versionId?: string|number
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
