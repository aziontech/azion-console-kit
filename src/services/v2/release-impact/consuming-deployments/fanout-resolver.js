/**
 * @typedef {import('./contract').ResolveConsumingDeployments} ResolveConsumingDeployments
 * @typedef {import('./contract').ResourceRef} ResourceRef
 * @typedef {import('./contract').ConsumingDeploymentsResult} ConsumingDeploymentsResult
 */

import { deploymentService as defaultDeploymentService } from '@/services/v2/deployment/deployment-service'
import { deploymentReleaseService as defaultDeploymentReleaseService } from '@/services/v2/deployment/deployment-release-service'
import { emptyResult, matchIdValue, normalizeResources, resourceKey } from './contract'

export const FANOUT_PRESELECT_DS_CAP = 50

const DS_LIST_PAGE_SIZE = 100
const FIRST_PAGE = 1

const listResponseBody = (response) => (Array.isArray(response?.body) ? response.body : [])
const listResponseCount = (response) =>
  Number.isFinite(response?.count) ? response.count : listResponseBody(response).length

const releaseResourceVersion = (releaseResource) =>
  releaseResource?.version_id ??
  releaseResource?.resource_version_id ??
  releaseResource?.resource_version ??
  null

const sameId = (left, right) => left != null && right != null && String(left) === String(right)

/**
 * @param {object} releaseResource
 * @param {ResourceRef} resource
 * @returns {boolean}
 */
const matchesResource = (releaseResource, resource) =>
  releaseResource?.resource_type === resource.resource_type &&
  sameId(matchIdValue(releaseResource), resource.resource_id)

/**
 * @param {object} [deps]
 * @param {typeof defaultDeploymentService} [deps.deploymentService]
 * @param {typeof defaultDeploymentReleaseService} [deps.deploymentReleaseService]
 * @returns {ResolveConsumingDeployments}
 */
export const createFanoutResolver = ({
  deploymentService = defaultDeploymentService,
  deploymentReleaseService = defaultDeploymentReleaseService
} = {}) => {
  /**
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

    if (listResponseCount(deploymentsResponse) > FANOUT_PRESELECT_DS_CAP) {
      return emptyResult()
    }

    const dsIds = listResponseBody(deploymentsResponse)
      .map((deployment) => deployment?.id)
      .filter((id) => id != null)

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

export const fanoutResolver = createFanoutResolver()
