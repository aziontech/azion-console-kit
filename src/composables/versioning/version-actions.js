import {
  isReady,
  isEditable,
  canArchive,
  canDelete,
  isActionAvailable,
  VERSION_ACTIONS
} from './version-machine'
import { getVersionCapability, DEFAULT_CAPABILITY } from './version-capability'

export const ACTION_META = {
  SAVE: { label: 'Save Draft' },
  SAVE_AND_BUILD: { label: 'Save and Build' },
  BUILD: { label: 'Build', icon: 'pi pi-cog' },
  CANCEL_BUILD: {
    label: 'Cancel Build',
    danger: true,
    dialog: {
      required: false,
      title: 'Cancel Build',
      actionLabel: 'Cancel Build',
      placeholder: 'Optional comment'
    }
  },
  NEW_DRAFT_FROM: {
    label: 'Clone as Draft',
    dialog: {
      required: false,
      title: 'Clone as Draft',
      actionLabel: 'Create Draft',
      placeholder: 'Optional comment'
    }
  },
  OPEN_CONFIGURATION: { label: 'Open configuration', icon: 'pi pi-sliders-h' },
  PROMOTE: { label: 'Promote version', icon: 'pi pi-arrow-up-right' },
  ROLLBACK: { label: 'Rollback to this version', icon: 'pi pi-history' },
  ARCHIVE: {
    label: 'Archive',
    icon: 'pi pi-inbox',
    dialog: {
      required: true,
      title: 'Archive Version',
      actionLabel: 'Archive',
      placeholder: 'Reason for archiving (required)'
    }
  },
  DELETE: {
    label: 'Delete',
    danger: true,
    icon: 'pi pi-trash',
    dialog: {
      title: 'Delete Version',
      actionLabel: 'Delete',
      message: 'Are you sure you want to delete this version? This action cannot be undone.',
      showComment: false,
      confirmSeverity: 'danger'
    }
  },
  DEPLOY: { label: 'Deploy', icon: 'pi pi-cloud-upload' }
}

export const metaFor = (action) => ACTION_META[action] ?? { label: action }

const ROLLBACK_DEFERRED_TOOLTIP =
  'Rollback depends on environment data and will be available in a later phase'

const VERSIONED_ONLY_NEW_DRAFT_LABEL = 'New version from this'

const BUILD_DISABLED_TOOLTIP = 'Only draft versions can be built'
const DEPLOY_DISABLED_TOOLTIP = 'Only Ready versions can be deployed'

/**
 * @param {string} state
 * @param {object} [ctx]
 * @param {object} [capability]
 * @returns {Array<{action,label,icon,disabled,tooltip,danger,separatorBefore}>}
 */
export const buildVersionMenuItems = (
  state,
  ctx = {},
  capability = getVersionCapability(ctx.resourceType)
) => {
  const item = (action, overrides = {}) => {
    const meta = metaFor(action)
    return {
      action,
      label: meta.label,
      icon: meta.icon ?? null,
      disabled: false,
      tooltip: null,
      danger: false,
      separatorBefore: false,
      ...overrides
    }
  }

  const buildDisabled = !isEditable(state)
  const deployDisabled = !isActionAvailable(state, VERSION_ACTIONS.DEPLOY, capability)
  const archiveDisabled = !canArchive(state)
  const deleteEnabled = canDelete(state)

  const items = [
    item('OPEN_CONFIGURATION'),
    item('BUILD', {
      disabled: buildDisabled,
      tooltip: buildDisabled ? BUILD_DISABLED_TOOLTIP : null
    })
  ]

  if (capability.canDeploy) {
    items.push(
      item('DEPLOY', {
        disabled: deployDisabled,
        tooltip: deployDisabled ? DEPLOY_DISABLED_TOOLTIP : null
      })
    )
  }

  if (capability.canPromote) {
    const promoteDisabled = !isReady(state)
    items.push(
      item('PROMOTE', {
        disabled: promoteDisabled,
        tooltip: promoteDisabled ? 'Only Ready versions can be promoted' : null
      }),
      item('ROLLBACK', { disabled: true, tooltip: ROLLBACK_DEFERRED_TOOLTIP })
    )
  } else {
    items.push(item('NEW_DRAFT_FROM', { label: VERSIONED_ONLY_NEW_DRAFT_LABEL }))
  }

  items.push(item('ARCHIVE', { disabled: archiveDisabled }))

  if (deleteEnabled) {
    items.push(item('DELETE', { danger: true, separatorBefore: true }))
  }

  return items
}

/**
 * @param {string} state
 * @param {object} ctx
 * @param {(payload:{action:string,item:object})=>void} onAction
 * @param {object} item
 * @param {object} [capability]
 */
export const mapVersionMenuItemsToMenu = (
  state,
  ctx,
  onAction,
  item,
  capability = getVersionCapability(ctx?.resourceType)
) => {
  const menu = []
  buildVersionMenuItems(state, ctx, capability).forEach((entry) => {
    if (entry.separatorBefore) menu.push({ separator: true })
    menu.push({
      label: entry.label,
      icon: entry.icon,
      disabled: entry.disabled,
      class: entry.danger && !entry.disabled ? 'danger' : null,
      tooltip: entry.tooltip,
      command: ({ originalEvent } = {}) => {
        originalEvent?.stopPropagation?.()
        onAction?.({ action: entry.action, item })
      }
    })
  })
  return menu
}

const BAR_CAPABILITY_FLAG = { DEPLOY: 'canDeploy', PROMOTE: 'canPromote', ROLLBACK: 'canRollback' }

const BAR_SAVE = { key: 'SAVE', label: 'Save', icon: 'pi pi-save', emphasis: 'secondary' }
const BAR_SAVE_AND_BUILD = {
  key: 'SAVE_AND_BUILD',
  label: 'Save and Build',
  icon: 'pi pi-cog',
  emphasis: 'primary'
}
const BAR_CANCEL_BUILD = {
  key: 'CANCEL_BUILD',
  label: 'Cancel Build',
  icon: 'pi pi-times',
  emphasis: 'secondary'
}
const BAR_NEW_VERSION = {
  key: 'NEW_DRAFT_FROM',
  label: 'New Version',
  icon: 'pi pi-plus',
  emphasis: 'secondary'
}
const BAR_DEPLOY = {
  key: 'DEPLOY',
  label: 'Deploy',
  icon: 'pi pi-cloud-upload',
  emphasis: 'primary'
}
const BAR_REDEPLOY = {
  key: 'DEPLOY',
  label: 'Redeploy',
  icon: 'pi pi-refresh',
  emphasis: 'secondary'
}

const VERSION_BAR_ACTIONS = {
  draft: [BAR_SAVE, BAR_SAVE_AND_BUILD],
  canceled: [BAR_SAVE, BAR_SAVE_AND_BUILD],
  error: [BAR_SAVE, BAR_SAVE_AND_BUILD],
  building: [BAR_CANCEL_BUILD],
  queued: [BAR_CANCEL_BUILD],
  ready: [BAR_NEW_VERSION, BAR_DEPLOY],
  active: [BAR_NEW_VERSION, BAR_REDEPLOY],
  archived: [BAR_NEW_VERSION]
}

export const getVersionBarActions = (state, capability = DEFAULT_CAPABILITY) =>
  (VERSION_BAR_ACTIONS[state] ?? [BAR_NEW_VERSION]).filter((action) => {
    const flag = BAR_CAPABILITY_FLAG[action.key]
    return !flag || capability[flag]
  })
