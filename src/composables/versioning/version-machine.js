import { DEFAULT_CAPABILITY } from './version-capability'

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

export const isEditable = (state) => ['draft', 'canceled', 'error'].includes(state)

export const isProcessing = (state) =>
  state === VERSION_STATES.QUEUED || state === VERSION_STATES.BUILDING

export const isImmutable = (state) => ['ready', 'active', 'archived'].includes(state)

export const isReady = (state) => state === VERSION_STATES.READY

export const canArchive = (state) =>
  [VERSION_STATES.READY, VERSION_STATES.ERROR, VERSION_STATES.CANCELED].includes(state)

export const canDelete = (state) => state !== 'deleted'

export const VERSION_ACTIONS = {
  SAVE: 'SAVE',
  SAVE_AND_BUILD: 'SAVE_AND_BUILD',
  CANCEL_BUILD: 'CANCEL_BUILD',
  NEW_DRAFT_FROM: 'NEW_DRAFT_FROM',
  ARCHIVE: 'ARCHIVE',
  DELETE: 'DELETE',
  DEPLOY: 'DEPLOY'
}

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

const CAPABILITY_GATED_ACTIONS = {
  DEPLOY: 'canDeploy',
  PROMOTE: 'canPromote',
  ROLLBACK: 'canRollback'
}

const isAllowedByCapability = (action, capability) => {
  const flag = CAPABILITY_GATED_ACTIONS[action]
  return flag ? capability[flag] !== false : true
}

export const getAvailableActions = (state, capability = DEFAULT_CAPABILITY) => {
  const actions = Object.hasOwn(STATE_ACTIONS, state) ? STATE_ACTIONS[state] : []
  return actions.filter((action) => isAllowedByCapability(action, capability))
}

export const isActionAvailable = (state, action, capability = DEFAULT_CAPABILITY) =>
  getAvailableActions(state, capability).includes(action)
