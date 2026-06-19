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
 * StatusTag component consumes.
 */
const STATE_STATUS = {
  [VERSION_STATES.DRAFT]: { content: 'Draft', severity: 'info' },
  [VERSION_STATES.QUEUED]: { content: 'Queued', severity: 'info' },
  [VERSION_STATES.BUILDING]: { content: 'Building', severity: 'info' },
  [VERSION_STATES.READY]: { content: 'Ready', severity: 'success' },
  [VERSION_STATES.ACTIVE]: { content: 'Active', severity: 'success' },
  [VERSION_STATES.ARCHIVED]: { content: 'Archived', severity: 'secondary' },
  [VERSION_STATES.CANCELED]: { content: 'Canceled', severity: 'warning' },
  [VERSION_STATES.ERROR]: { content: 'Error', severity: 'danger' }
}

/**
 * Parses a raw version state into the StatusTag `{ content, severity }` shape.
 * Unknown states fail soft: the original value is echoed with neutral severity.
 */
export const mapVersionStateToStatus = (state) =>
  STATE_STATUS[state] ?? { content: state || 'Unknown', severity: 'secondary' }

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
  canceled: ['NEW_DRAFT_FROM', 'DELETE'],
  error: ['DELETE', 'NEW_DRAFT_FROM']
}

/**
 * Returns the list of available actions for a given state.
 * Unknown states return an empty list (fail-closed).
 */
export const getAvailableActions = (state) => STATE_ACTIONS[state] ?? []

/**
 * Boolean used by buttons/menu items to toggle the disabled state.
 */
export const isActionAvailable = (state, action) => getAvailableActions(state).includes(action)
