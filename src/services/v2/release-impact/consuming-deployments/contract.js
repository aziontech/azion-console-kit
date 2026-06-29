/**
 * HOP 1 — `resolveConsumingDeployments` interface contract (single source of
 * truth for the shape every strategy must honour).
 *
 * This module owns ONLY the contract: the input/output shapes and the small,
 * pure helpers that encode the contract's invariants. It performs no IO and
 * imports nothing reactive. The concrete strategies (`fanoutResolver` today,
 * `resourceUsageResolver` later) live in sibling files and MUST produce a
 * result that satisfies {@link assertConsumingDeploymentsShape} — that is the
 * Liskov guarantee that lets `selectResolver()` swap one for the other without
 * touching any caller (req 1.2 / 1.4 / 8.3).
 *
 * Property 3 (task 9.3) is written directly against the helpers here and is
 * therefore reusable, unchanged, for the future `resourceUsageResolver`.
 */

/**
 * A resource reference accepted by the interface. A single value or a list of
 * 1..N is accepted (req 6.1); callers normalise via {@link normalizeResources}.
 *
 * @typedef {object} ResourceRef
 * @property {string} resource_type - e.g. `'application'`, `'function'`, `'waf'`.
 * @property {string|number} resource_id - the resource identifier. For
 *   `resource_type === 'application'` this is matched against the active
 *   release's `global_id`; for every other type against `resource_id` (req 1.5).
 */

/**
 * A consuming deployment in the resolver output. `activeVersionByResource`
 * carries the version of each matched resource pinned in THIS deployment's
 * active release (req 1.1); its keys are {@link resourceKey} values so a 1..N
 * resolution can disambiguate per resource.
 *
 * @typedef {object} ConsumingDeployment
 * @property {string} deploymentId - the consuming Deployment Settings id.
 * @property {Object<string, (string|number|null)>} activeVersionByResource -
 *   `{ [resourceKey]: version_id|null }` for each resource matched in this DS.
 */

/**
 * The interface output (req 1.7). `deployments` is the union of consuming
 * deployments de-duplicated by `deploymentId`; `matchedByDeployment` preserves
 * which resource(s) matched each deployment, keyed by deployment id.
 *
 * @typedef {object} ConsumingDeploymentsResult
 * @property {ConsumingDeployment[]} deployments - de-duplicated by `deploymentId`.
 * @property {Map<string, ResourceRef[]>} matchedByDeployment - per-DS the list
 *   of resources that matched it (so the consumer knows why a DS was selected).
 */

/**
 * The resolver function contract every strategy implements.
 *
 * @callback ResolveConsumingDeployments
 * @param {ResourceRef|ResourceRef[]} resources - one or many resource refs (req 6.1).
 * @returns {Promise<ConsumingDeploymentsResult>} the de-duplicated union (req 1.7).
 *   When no resource has an active binding, resolves to the EMPTY result, never
 *   rejects (req 1.6); see {@link emptyResult}.
 */

/**
 * Resource type that matches the active release by `global_id` instead of
 * `resource_id` (req 1.5). The single place this rule is encoded.
 */
export const APPLICATION_RESOURCE_TYPE = 'application'

/**
 * Stable key for a resource ref, used as the `activeVersionByResource` key and
 * to de-duplicate a resource list. `resource_type` is part of the key because
 * the same numeric id can exist across different types.
 *
 * @param {ResourceRef} resource
 * @returns {string}
 */
export const resourceKey = (resource) => `${resource?.resource_type}:${resource?.resource_id}`

/**
 * The release field a given resource is matched against: `global_id` for
 * `application`, `resource_id` for every other type (req 1.5). Encoding this
 * once keeps the rule out of every strategy.
 *
 * @param {ResourceRef} resource
 * @returns {'global_id'|'resource_id'}
 */
export const matchFieldFor = (resource) =>
  resource?.resource_type === APPLICATION_RESOURCE_TYPE ? 'global_id' : 'resource_id'

/**
 * Normalise the 1..N input into a clean `ResourceRef[]` (req 6.1): wraps a
 * single ref, drops nullish entries and entries missing a `resource_id`, and
 * de-duplicates by {@link resourceKey} so a strategy never scans the same
 * resource twice.
 *
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
 * The canonical empty result (req 1.6): no consuming deployments, empty match
 * map. Strategies return this when nothing matches; callers can read it
 * unguarded.
 *
 * @returns {ConsumingDeploymentsResult}
 */
export const emptyResult = () => ({ deployments: [], matchedByDeployment: new Map() })

/**
 * Assert that a value satisfies the {@link ConsumingDeploymentsResult} contract.
 * Used by Property 3 (task 9.3) and any strategy's own tests; throws an
 * `Error` with a precise message on the first violation so the failing
 * invariant is obvious.
 *
 * Invariants checked:
 *  - top-level `{ deployments: array, matchedByDeployment: Map }`;
 *  - every deployment is `{ deploymentId, activeVersionByResource: object }`;
 *  - `deployments` is de-duplicated by `deploymentId` (req 1.7);
 *  - every `matchedByDeployment` key has a corresponding deployment and a
 *    non-empty `ResourceRef[]` value (a DS is only matched because a resource
 *    matched it).
 *
 * @param {unknown} result
 * @returns {true} when valid (otherwise throws).
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
