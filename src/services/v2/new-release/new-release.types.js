/**
 * @typedef {'draft'|'ready'|'queued'|'building'|'error'|'canceled'|'archiving'|'archived'} VersionState
 */

/**
 * @typedef {'single_version'|'versioned_urls'} DeploymentPolicy
 */

/**
 * @typedef {Object} PromotionContextVM
 * @property {{ id: string, name: string, type: string }} resource
 * @property {{ id: string, state: VersionState, promotable: boolean, reason?: string }} version
 */

/**
 * @typedef {Object} EnvironmentRowVM
 * @property {string} environmentId
 * @property {string} name
 * @property {DeploymentPolicy} deploymentPolicy
 * @property {{ id: string, name: string }} deployment
 * @property {number|null} workloadCount
 * @property {{ id: string, name: string }|null} activeRelease
 * @property {boolean} consumes
 */

/**
 * @typedef {Object} CompositionItemVM
 * @property {string} resourceType
 * @property {string} resourceId
 * @property {string} resourceVersion
 * @property {boolean} editable
 */

/**
 * @typedef {Object} CompositionVM
 * @property {['application']} required
 * @property {CompositionItemVM[]} items
 * @property {Array<{ resourceType: string, resourceId: string, resourceVersion: string }>} keep
 */

/**
 * @typedef {Object} SubmitResultVM
 * @property {string} releaseId
 * @property {VersionState} state
 * @property {string} traceId
 */

export {}
