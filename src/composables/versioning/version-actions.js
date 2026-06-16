/**
 * Presentation metadata for version lifecycle actions, shared between the
 * VersionShell action bar (`VersionActionBar.vue`) and the version listing's
 * per-row action menu (`VersionListDataView`). Single source of truth for
 * labels and dialog config so the two surfaces never drift.
 *
 * The state→actions matrix itself lives in `version-machine.js`
 * (`getAvailableActions`); this module only adds the *presentation* layer plus
 * the list-row eligibility filter.
 */
import { getAvailableActions, VERSION_ACTIONS, VERSION_STATES } from './version-machine'

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
  ARCHIVE: {
    label: 'Archive',
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

/**
 * Actions eligible to appear in a LIST ROW menu (not the shell action bar).
 * Excludes the editing actions (SAVE / SAVE_AND_BUILD — they need the form and
 * the shell command bus) and DEPLOY (no API endpoint yet — it is a stub).
 */
const ROW_ELIGIBLE = new Set([
  VERSION_ACTIONS.NEW_DRAFT_FROM,
  VERSION_ACTIONS.ARCHIVE,
  VERSION_ACTIONS.DELETE
])

/**
 * Returns the management actions a list row should offer for a given version
 * state: `getAvailableActions(state)` intersected with the row-eligible set,
 * preserving the state-machine order. Empty for `building`/unknown (fail-closed).
 * @param {string} state version lifecycle state
 * @returns {string[]} eligible action keys for a row menu
 */
export const getRowActions = (state) => {
  const base = getAvailableActions(state).filter((action) => ROW_ELIGIBLE.has(action))
  // A draft can be built straight from the list. The shell builds via
  // SAVE_AND_BUILD (which first persists the open form); from the list the draft
  // is already saved, so we offer a plain BUILD of the saved snapshot. BUILD is
  // not part of the editing state machine, so it is added here as a list-only
  // affordance for the draft state.
  if (state === VERSION_STATES.DRAFT) return ['BUILD', ...base]
  return base
}
