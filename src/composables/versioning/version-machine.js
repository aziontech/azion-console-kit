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
 * Maps each canonical version state to the `{ content, severity }` shape the
 * StatusTag component consumes. The version in use reads as "Current": `active`
 * when the API exposes it, otherwise the latest Ready resolved by the host.
 */
const STATE_STATUS = {
  [VERSION_STATES.DRAFT]: { content: 'Draft', severity: 'info' },
  [VERSION_STATES.QUEUED]: { content: 'Queued', severity: 'info' },
  [VERSION_STATES.BUILDING]: { content: 'Building', severity: 'info' },
  [VERSION_STATES.READY]: { content: 'Ready', severity: 'success' },
  [VERSION_STATES.ACTIVE]: { content: 'Current', severity: 'success' },
  [VERSION_STATES.ARCHIVED]: { content: 'Archived', severity: 'secondary' },
  [VERSION_STATES.CANCELED]: { content: 'Canceled', severity: 'warning' },
  [VERSION_STATES.ERROR]: { content: 'Error', severity: 'danger' }
}

/**
 * The version in use status, shown when the host marks a built version as the
 * current one (latest Ready fallback, since the API has no current field).
 */
const CURRENT_STATUS = { content: 'Current', severity: 'success' }

/**
 * Parses a raw version state into the StatusTag `{ content, severity }` shape.
 * When `isCurrent` is set, a built (`ready`/`active`) version reads as "Current".
 * Unknown states fail soft: the original value is echoed with neutral severity.
 */
export const mapVersionStateToStatus = (state, isCurrent = false) => {
  if (isCurrent && (state === VERSION_STATES.READY || state === VERSION_STATES.ACTIVE)) {
    return CURRENT_STATUS
  }
  return STATE_STATUS[state] ?? { content: state || 'Unknown', severity: 'secondary' }
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
 * Terminal state from which no transition is possible.
 */
export const isTerminal = (state) => state === 'archived'

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
 * Open configuration is always available, including `archived` (Req 2.1).
 */
export const isOpenable = () => true

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
