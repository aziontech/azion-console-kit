/**
 * HOP 1 strategy — `fanoutResolver` (the ACTIVE strategy today).
 *
 * Refactored out of the inline `resolveConsumingDsIds` in
 * `use-release-composition.js` (req 1.1, 1.3): there is no `resource_id` filter
 * on the DS list (verified 400, req 11.1), so consumption is assembled in the
 * browser by listing the Deployment Settings and scanning each one's active
 * release for the requested resource(s).
 *
 *   - list Deployment Settings (cached `deploymentService.listDeploymentsService`);
 *   - when DS count ≤ 50, load+scan each DS's active release composition
 *     (`deploymentReleaseService.getActiveReleaseComposition`, cached) and match
 *     each resource using {@link matchFieldFor} — `application` against the
 *     release `global_id`, every other type against `resource_id` (req 1.5);
 *   - return the de-duplicated union with `matchedByDeployment` (req 1.7),
 *     pinning each matched resource to its release `version_id` (req 1.1);
 *   - when DS count > 50, return the EMPTY result (no preselection, req 1.8);
 *   - a per-DS read failure is isolated (independent fan-out, `allSettled`):
 *     it never blocks the others and never fabricates a composition.
 *
 * Dependencies are taken as a factory argument (services-as-args) so this is
 * unit-testable without a Vue context and without real IO — the same injection
 * style as the impact lookup service (design §3.3). Only tenant services are
 * used; never raw fetch/axios and never the s2s reverse-lookup endpoints
 * (req 9.2, 10.2).
 *
 * @typedef {import('./contract').ResolveConsumingDeployments} ResolveConsumingDeployments
 * @typedef {import('./contract').ResourceRef} ResourceRef
 * @typedef {import('./contract').ConsumingDeploymentsResult} ConsumingDeploymentsResult
 */

import { deploymentService as defaultDeploymentService } from '@/services/v2/deployment/deployment-service'
import { deploymentReleaseService as defaultDeploymentReleaseService } from '@/services/v2/deployment/deployment-release-service'
import { emptyResult, matchFieldFor, normalizeResources, resourceKey } from './contract'

/**
 * Maximum Deployment Settings count the fan-out scans for preselection
 * (req 1.8). Above this the resolver returns empty (the user picks manually)
 * rather than fanning out over the full inventory. Defined here so the boundary
 * is asserted in one place.
 */
export const FANOUT_PRESELECT_DS_CAP = 50

// The DS list caps at 100 items per page; request a full page so a tenant at or
// below the preselect cap is covered by a single call. The `count` field is the
// authoritative inventory size used for the cap check (not the page length).
const DS_LIST_PAGE_SIZE = 100
const FIRST_PAGE = 1

const listResponseBody = (response) => (Array.isArray(response?.body) ? response.body : [])
const listResponseCount = (response) =>
  Number.isFinite(response?.count) ? response.count : listResponseBody(response).length

// The active release keys each consumed resource by `resource_id` for every
// type except `application`, which uses `global_id`; this reads the id the
// resource is matched against per {@link matchFieldFor}.
const releaseFieldValue = (releaseResource, field) => releaseResource?.[field] ?? null

// The release pins the chosen version in `version_id` (design §L); fall back to
// the other shapes the API has used so the match always carries the real id.
const releaseResourceVersion = (releaseResource) =>
  releaseResource?.version_id ??
  releaseResource?.resource_version_id ??
  releaseResource?.resource_version ??
  null

const sameId = (left, right) => left != null && right != null && String(left) === String(right)

/**
 * Does this release resource match the requested resource ref? An
 * `application` ref matches the release `global_id`; every other type matches
 * the release `resource_id` (req 1.5). Ids are string-coerced so a numeric
 * request matches a string id and vice versa.
 *
 * @param {object} releaseResource - one entry of an active release `resources[]`.
 * @param {ResourceRef} resource - the requested resource ref.
 * @returns {boolean}
 */
const matchesResource = (releaseResource, resource) =>
  releaseResource?.resource_type === resource.resource_type &&
  sameId(releaseFieldValue(releaseResource, matchFieldFor(resource)), resource.resource_id)

/**
 * Build the fan-out resolver over the given tenant services.
 *
 * Exported as a factory so tests inject fakes (services by factory-arg); the
 * production singleton (`fanoutResolver`) wires the real services.
 *
 * @param {object} [deps]
 * @param {typeof defaultDeploymentService} [deps.deploymentService] - lists DS.
 * @param {typeof defaultDeploymentReleaseService} [deps.deploymentReleaseService] -
 *   reads each DS's active release composition (cached).
 * @returns {ResolveConsumingDeployments} a resolver honouring the interface
 *   contract in {@link ./contract.js}.
 */
export const createFanoutResolver = ({
  deploymentService = defaultDeploymentService,
  deploymentReleaseService = defaultDeploymentReleaseService
} = {}) => {
  /**
   * Scan one DS's active release for the requested resources. Returns the
   * matched refs (in request order) and the `activeVersionByResource` slice
   * pinning each match to its release `version_id`.
   *
   * @param {string} dsId
   * @param {ResourceRef[]} resources
   * @returns {Promise<{ matched: ResourceRef[], activeVersionByResource: object }>}
   */
  const scanDeployment = async (dsId, resources) => {
    const release = await deploymentReleaseService.getActiveReleaseComposition(dsId)
    const releaseResources = Array.isArray(release?.resources) ? release.resources : []

    const matched = []
    const activeVersionByResource = {}

    for (const resource of resources) {
      const hit = releaseResources.find((releaseResource) =>
        matchesResource(releaseResource, resource)
      )
      if (!hit) continue
      matched.push(resource)
      activeVersionByResource[resourceKey(resource)] = releaseResourceVersion(hit)
    }

    return { matched, activeVersionByResource }
  }

  /** @type {ResolveConsumingDeployments} */
  return async (resources) => {
    const refs = normalizeResources(resources)
    if (refs.length === 0) return emptyResult()

    const deploymentsResponse = await deploymentService.listDeploymentsService({
      page: FIRST_PAGE,
      pageSize: DS_LIST_PAGE_SIZE
    })

    // req 1.8: above the preselect cap the fan-out is skipped entirely — the
    // screen opens without preselection rather than scanning the full inventory.
    if (listResponseCount(deploymentsResponse) > FANOUT_PRESELECT_DS_CAP) {
      return emptyResult()
    }

    const dsIds = listResponseBody(deploymentsResponse)
      .map((deployment) => deployment?.id)
      .filter((id) => id != null)

    // Independent fan-out (mirrors the active-release fan-out in
    // use-release-composition, §7.3): a single failed read must not drop the
    // rest, and a failed DS simply contributes no match.
    const settled = await Promise.allSettled(
      dsIds.map(async (dsId) => ({ dsId, ...(await scanDeployment(dsId, refs)) }))
    )

    const deployments = []
    const matchedByDeployment = new Map()

    for (const outcome of settled) {
      if (outcome.status !== 'fulfilled') continue
      const { dsId, matched, activeVersionByResource } = outcome.value
      if (matched.length === 0) continue
      deployments.push({ deploymentId: dsId, activeVersionByResource })
      matchedByDeployment.set(dsId, matched)
    }

    return { deployments, matchedByDeployment }
  }
}

/**
 * Production singleton (the strategy `selectResolver()` returns today), wired to
 * the real tenant `deploymentService` + `deploymentReleaseService`.
 */
export const fanoutResolver = createFanoutResolver()
