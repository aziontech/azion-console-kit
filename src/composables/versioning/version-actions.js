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
 * Builds the FIXED 5-item version row menu in spec order
 * `[OPEN_CONFIGURATION, PROMOTE, ROLLBACK, ARCHIVE, DELETE]`. Pure: enablement
 * derives only from `state` (via version-machine predicates), no I/O. The
 * "never hide" pattern — items stay visible+disabled with a tooltip; only
 * DELETE is omitted when the version is already `deleted`.
 * @param {string} state version lifecycle state
 * @param {object} [ctx] reserved for Phase 2 gating (unused here)
 * @returns {Array<{action,label,icon,disabled,tooltip,danger,separatorBefore}>}
 */
// eslint-disable-next-line no-unused-vars
export const buildVersionMenuItems = (state, ctx = {}) => {
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

  const promoteDisabled = !isReady(state)
  const archiveDisabled = !canArchive(state)
  const deleteEnabled = canDelete(state)

  const items = [
    item('OPEN_CONFIGURATION'),
    item('PROMOTE', {
      disabled: promoteDisabled,
      tooltip: promoteDisabled ? 'Only Ready versions can be promoted' : null
    }),
    // Phase 2 (Req 11): Rollback stays always-disabled until the
    // version↔release↔environment data lands; no behavior wired here yet.
    item('ROLLBACK', { disabled: true, tooltip: ROLLBACK_DEFERRED_TOOLTIP }),
    item('ARCHIVE', { disabled: archiveDisabled })
  ]

  if (deleteEnabled) {
    items.push(item('DELETE', { danger: true, separatorBefore: true }))
  }

  return items
}

/**
 * Maps the pure menu model to PrimeVue MenuItems, injecting a native separator
 * before Delete and forwarding `tooltip`/`danger` for the styled item slot. The
 * single mapper shared by every listing (VersionListDataView, deployment VersionsTab)
 * so the rendered menu is byte-identical (Req 1.4). The command stops propagation
 * so the click never bubbles to the row (Req 2.4), then calls `onAction`.
 * @param {string} state version lifecycle state
 * @param {object} ctx context forwarded to buildVersionMenuItems (Phase 2)
 * @param {(payload:{action:string,item:object})=>void} onAction row-action handler
 * @param {object} item the version row the menu acts on
 */
export const mapVersionMenuItemsToMenu = (state, ctx, onAction, item) => {
  const menu = []
  buildVersionMenuItems(state, ctx).forEach((entry) => {
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
