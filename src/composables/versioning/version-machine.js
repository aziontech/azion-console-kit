import { DEFAULT_CAPABILITY } from './version-capability'

/**
 * Canonical states returned by the Version API.
 * Source of truth: docs/edge-api/APPLICATIONS.md
 */
export const VERSION_STATES = {
  DRAFT: 'draft',
  QUEUED: 'queued',
  BUILDING: 'building',
  READY: 'ready',
  ACTIVE: 'active',
  ARCHIVED: 'archived',
  CANCELED: 'canceled',
  ERROR: 'error'
}

/**
 * A version is editable when the user can mutate its payload.
 * `draft` is the natural editing state; `canceled` and `error` are
 * recoverable terminal states where the user resumes work on the same draft.
 */
export const isEditable = (state) => ['draft', 'canceled', 'error'].includes(state)

/**
 * Version is queued or being built by the platform — the UI locks writes.
 */
export const isProcessing = (state) =>
  state === VERSION_STATES.QUEUED || state === VERSION_STATES.BUILDING

/**
 * Immutable states: the version exists as a frozen artifact.
 * `ready` (built, idle), `active` (built, serving traffic) and `archived`
 * (retired) cannot be edited in place; the user must fork a draft.
 */
export const isImmutable = (state) => ['ready', 'active', 'archived'].includes(state)

/**
 * Row-menu predicates (single source of enablement for the version menu).
 * Pure: same input → same output, no I/O. Open-configuration read-only vs.
 * editable reuses `isEditable` above. See spec version-actions-menu Req 2/3/5/6/7.
 */

/**
 * Promote is enabled only for a built, idle version (`ready`).
 */
export const isReady = (state) => state === VERSION_STATES.READY

/**
 * Archive is enabled when the version is built-but-idle or recoverable,
 * i.e. `state ∈ {ready, error, canceled}` (Req 5.1). Backend stays the
 * authority on "in use as Current"; pre-emptive blocking is Phase 2.
 */
export const canArchive = (state) =>
  [VERSION_STATES.READY, VERSION_STATES.ERROR, VERSION_STATES.CANCELED].includes(state)

/**
 * Delete is enabled for any version still present, i.e. not already deleted
 * (Req 6.1). A `deleted` version is absent from the list, hence the guard.
 */
export const canDelete = (state) => state !== 'deleted'

/**
 * High-level actions exposed by the VersionShell UI.
 * These are user intents; the underlying service call is resolved
 * downstream by the command bus handlers.
 */
export const VERSION_ACTIONS = {
  SAVE: 'SAVE',
  SAVE_AND_BUILD: 'SAVE_AND_BUILD',
  CANCEL_BUILD: 'CANCEL_BUILD',
  NEW_DRAFT_FROM: 'NEW_DRAFT_FROM',
  ARCHIVE: 'ARCHIVE',
  DELETE: 'DELETE',
  DEPLOY: 'DEPLOY'
}

/**
 * Authoritative matrix: state -> list of allowed actions.
 *
 * - `active` inherits the same set as `ready` (both are immutable and built;
 *   the only difference is serving traffic, which does not change what the
 *   user can do through the shell).
 * - `canceled` and `error` inherit the same set as `draft` because they are
 *   recoverable states (the user resumes the draft).
 * - `queued`/`building` are transient locks — the only way out is CANCEL_BUILD.
 * - `archived` cannot be edited; only fork a new draft or delete.
 */
export const STATE_ACTIONS = {
  draft: ['SAVE', 'SAVE_AND_BUILD', 'NEW_DRAFT_FROM', 'DELETE'],
  queued: ['CANCEL_BUILD'],
  building: ['CANCEL_BUILD'],
  ready: ['NEW_DRAFT_FROM', 'ARCHIVE', 'DELETE', 'DEPLOY'],
  active: ['NEW_DRAFT_FROM', 'ARCHIVE', 'DELETE', 'DEPLOY'],
  archived: ['NEW_DRAFT_FROM', 'DELETE'],
  canceled: ['SAVE', 'SAVE_AND_BUILD', 'NEW_DRAFT_FROM', 'DELETE'],
  error: ['SAVE', 'SAVE_AND_BUILD', 'NEW_DRAFT_FROM', 'DELETE']
}

/**
 * Lifecycle actions gated by the resource capability. When a capability denies
 * one, it is filtered out of `getAvailableActions` regardless of state.
 */
const CAPABILITY_GATED_ACTIONS = {
  DEPLOY: 'canDeploy',
  PROMOTE: 'canPromote',
  ROLLBACK: 'canRollback'
}

/**
 * True when `action` is allowed by the given capability. Non-gated actions
 * (Save, Build, Delete, …) are always allowed.
 */
const isAllowedByCapability = (action, capability) => {
  const flag = CAPABILITY_GATED_ACTIONS[action]
  return flag ? capability[flag] !== false : true
}

/**
 * Returns the list of available actions for a given state, filtered by the
 * resource `capability`. Unknown states return an empty list (fail-closed).
 * Pure: same input → same output, no I/O. The default capability is
 * `deployable`, so omitting it preserves the prior output exactly.
 */
export const getAvailableActions = (state, capability = DEFAULT_CAPABILITY) =>
  (STATE_ACTIONS[state] ?? []).filter((action) => isAllowedByCapability(action, capability))

/**
 * Boolean used by buttons/menu items to toggle the disabled state.
 * `capability` defaults to `deployable`, preserving the prior behavior.
 */
export const isActionAvailable = (state, action, capability = DEFAULT_CAPABILITY) =>
  getAvailableActions(state, capability).includes(action)
