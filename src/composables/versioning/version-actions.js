/**
 * Presentation metadata for version lifecycle actions, shared between the
 * VersionShell action bar (`VersionActionBar.vue`) and the version listing's
 * per-row action menu (`VersionListDataView`). Single source of truth for
 * labels and dialog config so the two surfaces never drift.
 *
 * The state→actions matrix itself lives in `version-machine.js`
 * (`getAvailableActions`); this module only adds the *presentation* layer plus
 * the fixed row-menu model (`buildVersionMenuItems`).
 */
import { isReady, canArchive, canDelete } from './version-machine'
import { getVersionCapability, DEFAULT_CAPABILITY } from './version-capability'

/**
 * Intrinsic, state-independent metadata for each action:
 *  - `label`: button / menu-item text.
 *  - `danger`: destructive/negative action → red emphasis wherever it renders.
 *  - `dialog`: when present, the action opens VersionActionDialog before
 *    dispatching. Its shape maps to the dialog props (required → require-comment,
 *    title, actionLabel, placeholder, message, showComment, confirmSeverity).
 *      • comment dialog (ARCHIVE/CANCEL_BUILD/NEW_DRAFT_FROM) — collects a comment.
 *      • confirmation dialog (DELETE) — `showComment: false`, warning copy,
 *        danger confirm button.
 *  CANCEL_BUILD is marked `danger` so it keeps the red emphasis it had as the
 *  `building` primary.
 */
export const ACTION_META = {
  SAVE: { label: 'Save Draft' },
  SAVE_AND_BUILD: { label: 'Save and Build' },
  BUILD: { label: 'Build' },
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
  DEPLOY: { label: 'Deploy' }
}

export const metaFor = (action) => ACTION_META[action] ?? { label: action }

// Clone/Build never appear in the row menu — those flows live in the shell
// action bar (VersionActionBar). The row menu is the fixed 5-item model below;
// the legacy `getRowActions` filter was retired in Phase 4 (task 9.1).

/**
 * Tooltip shown while Rollback stays disabled (Phase 2 — depends on the
 * version↔release↔environment data not available in the list yet).
 */
const ROLLBACK_DEFERRED_TOOLTIP =
  'Rollback depends on environment data and will be available in a later phase'

/**
 * Label shown for NEW_DRAFT_FROM in the versioned-only kebab. Overridden on the
 * item only — `ACTION_META.NEW_DRAFT_FROM` ('Clone as Draft') stays untouched so
 * the shell action bar keeps its copy.
 */
const VERSIONED_ONLY_NEW_DRAFT_LABEL = 'New version from this'

/**
 * Builds the version row menu, gated by the resource `capability`. Pure:
 * enablement derives only from `state` (via version-machine predicates), no I/O.
 * The "never hide" pattern — items stay visible+disabled with a tooltip; only
 * DELETE is omitted when the version is already `deleted`.
 *
 * Deployable (default) keeps the fixed 5-item order
 * `[OPEN_CONFIGURATION, PROMOTE, ROLLBACK, ARCHIVE, DELETE]`. When the capability
 * denies Promote, PROMOTE and ROLLBACK are omitted and NEW_DRAFT_FROM is inserted
 * with a "New version from this" label override →
 * `[OPEN_CONFIGURATION, NEW_DRAFT_FROM, ARCHIVE, DELETE]`.
 * @param {string} state version lifecycle state
 * @param {object} [ctx] context; `resourceType` resolves the default capability
 * @param {object} [capability] `{canDeploy,canPromote,canRollback}`; defaults
 *   from `ctx.resourceType` (deployable when unknown)
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

  const archiveDisabled = !canArchive(state)
  const deleteEnabled = canDelete(state)

  const items = [item('OPEN_CONFIGURATION')]

  if (capability.canPromote) {
    const promoteDisabled = !isReady(state)
    items.push(
      item('PROMOTE', {
        disabled: promoteDisabled,
        tooltip: promoteDisabled ? 'Only Ready versions can be promoted' : null
      }),
      // Phase 2 (Req 11): Rollback stays always-disabled until the
      // version↔release↔environment data lands; no behavior wired here yet.
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
 * Maps the pure menu model to PrimeVue MenuItems, injecting a native separator
 * before Delete and forwarding `tooltip`/`danger` for the styled item slot. The
 * single mapper shared by every listing (VersionListDataView, DeploymentVersionsList)
 * so the rendered menu is byte-identical (Req 1.4). The command stops propagation
 * so the click never bubbles to the row (Req 2.4), then calls `onAction`.
 * @param {string} state version lifecycle state
 * @param {object} ctx context forwarded to buildVersionMenuItems (Phase 2)
 * @param {(payload:{action:string,item:object})=>void} onAction row-action handler
 * @param {object} item the version row the menu acts on
 * @param {object} [capability] capability passed through to buildVersionMenuItems;
 *   defaults from `ctx.resourceType` (deployable when unknown)
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

/**
 * Capability-gated lifecycle actions: hidden entirely when the resource class
 * (versioned-only) denies them. Deploy/Promote/Rollback only.
 */
const BAR_CAPABILITY_FLAG = { DEPLOY: 'canDeploy', PROMOTE: 'canPromote', ROLLBACK: 'canRollback' }

// Single definition per button (key/label/icon/emphasis), reused across states.
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

/**
 * SINGLE source of the lifecycle action buttons per state (ordered, with
 * emphasis). Shared by the footer action bar AND the heading actions so the two
 * surfaces never diverge. Deploy appears only on built states (ready/active) and
 * is removed for versioned-only via capability. Callers still intersect with
 * `availableActions` (state ∩ registered) and disable via `disabledActions`.
 */
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
