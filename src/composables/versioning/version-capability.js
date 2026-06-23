/**
 * Version capability — the single source of truth for how a resource class
 * behaves in the Version Shell. A capability is the immutable shape
 * `{ canDeploy, canPromote, canRollback }`; it is resolved from a central
 * `resourceType → capability` map so the shared shell never forks per resource.
 *
 * Pure data + a pure lookup: no state, no I/O, no Vue. Surfaces inside the shell
 * receive it via the version-context; pure functions running outside the shell
 * (`getAvailableActions`, `buildVersionMenuItems`) take it as an argument.
 */

/**
 * Default class — `deployable`. Keeps App/Firewall/Workload/Custom Page/Connector
 * (and legacy/v3) byte-identical: it is also the fallback for unknown types.
 */
export const DEFAULT_CAPABILITY = Object.freeze({
  canDeploy: true,
  canPromote: true,
  canRollback: true
})

/**
 * `versioned-only` class — no Deploy/Promote/Rollback affordances. Applied to
 * sub-resources whose version is resolved by the platform, not released by hand.
 */
export const VERSIONED_ONLY = Object.freeze({
  canDeploy: false,
  canPromote: false,
  canRollback: false
})

/**
 * Central map of resource type → capability. Only divergences from the default
 * are listed; everything else falls back to `DEFAULT_CAPABILITY` (deployable).
 */
export const RESOURCE_CAPABILITY = Object.freeze({
  function: VERSIONED_ONLY,
  network_list: VERSIONED_ONLY,
  waf: VERSIONED_ONLY
})

/**
 * Resolves the capability for a resource type. Unknown/omitted types fall back
 * to `DEFAULT_CAPABILITY`, so any resource is deployable until declared otherwise.
 * @param {string} [resourceType] resource class identifier (e.g. 'function')
 * @returns {{canDeploy: boolean, canPromote: boolean, canRollback: boolean}}
 */
export const getVersionCapability = (resourceType) =>
  RESOURCE_CAPABILITY[resourceType] ?? DEFAULT_CAPABILITY
