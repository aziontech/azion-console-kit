export const DEFAULT_CAPABILITY = Object.freeze({
  canDeploy: true,
  canPromote: true,
  canRollback: true
})

export const VERSIONED_ONLY = Object.freeze({
  canDeploy: false,
  canPromote: false,
  canRollback: false
})

export const RESOURCE_CAPABILITY = Object.freeze({
  function: VERSIONED_ONLY,
  network_list: VERSIONED_ONLY,
  waf: VERSIONED_ONLY
})

/**
 * @param {string} [resourceType]
 * @returns {{canDeploy: boolean, canPromote: boolean, canRollback: boolean}}
 */
export const getVersionCapability = (resourceType) =>
  RESOURCE_CAPABILITY[resourceType] ?? DEFAULT_CAPABILITY
