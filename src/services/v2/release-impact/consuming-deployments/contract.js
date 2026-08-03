/**
 * @typedef {object} ResourceRef
 * @property {string} resource_type
 * @property {string|number} resource_id
 */

/**
 * @typedef {object} ConsumingDeployment
 * @property {string} deploymentId
 * @property {Object<string, (string|number|null)>} activeVersionByResource
 */

/**
 * @typedef {object} ConsumingDeploymentsResult
 * @property {ConsumingDeployment[]} deployments
 * @property {Map<string, ResourceRef[]>} matchedByDeployment
 */

/**
 * @callback ResolveConsumingDeployments
 * @param {ResourceRef|ResourceRef[]} resources
 * @returns {Promise<ConsumingDeploymentsResult>}
 */

export const APPLICATION_RESOURCE_TYPE = 'application'

/**
 * @param {ResourceRef} resource
 * @returns {string}
 */
export const resourceKey = (resource) => `${resource?.resource_type}:${resource?.resource_id}`

/**
 * @param {object} resource
 * @returns {string|number|null}
 */
export const matchIdValue = (resource) => resource?.resource_id ?? resource?.global_id ?? null

/**
 * @param {ResourceRef|ResourceRef[]} resources
 * @returns {ResourceRef[]}
 */
export const normalizeResources = (resources) => {
  const list = Array.isArray(resources) ? resources : [resources]
  const seen = new Set()
  const out = []
  for (const resource of list) {
    if (!resource || resource.resource_type == null || resource.resource_id == null) continue
    const key = resourceKey(resource)
    if (seen.has(key)) continue
    seen.add(key)
    out.push(resource)
  }
  return out
}

/**
 * @returns {ConsumingDeploymentsResult}
 */
export const emptyResult = () => ({ deployments: [], matchedByDeployment: new Map() })

/**
 * @param {unknown} result
 * @returns {true}
 */
export const assertConsumingDeploymentsShape = (result) => {
  if (!result || typeof result !== 'object') {
    throw new Error('resolveConsumingDeployments must return an object')
  }
  if (!Array.isArray(result.deployments)) {
    throw new Error('result.deployments must be an array')
  }
  if (!(result.matchedByDeployment instanceof Map)) {
    throw new Error('result.matchedByDeployment must be a Map')
  }

  const ids = new Set()
  for (const deployment of result.deployments) {
    if (!deployment || typeof deployment !== 'object') {
      throw new Error('every deployment must be an object')
    }
    if (deployment.deploymentId == null) {
      throw new Error('every deployment must carry a deploymentId')
    }
    if (ids.has(deployment.deploymentId)) {
      throw new Error(
        `deployments must be de-duplicated by deploymentId (duplicate: ${deployment.deploymentId})`
      )
    }
    ids.add(deployment.deploymentId)
    if (
      !deployment.activeVersionByResource ||
      typeof deployment.activeVersionByResource !== 'object'
    ) {
      throw new Error(
        `deployment ${deployment.deploymentId} must carry an activeVersionByResource object`
      )
    }
  }

  for (const [dsId, matched] of result.matchedByDeployment) {
    if (!ids.has(dsId)) {
      throw new Error(`matchedByDeployment key ${dsId} has no corresponding deployment`)
    }
    if (!Array.isArray(matched) || matched.length === 0) {
      throw new Error(`matchedByDeployment[${dsId}] must be a non-empty array of resource refs`)
    }
  }

  return true
}
