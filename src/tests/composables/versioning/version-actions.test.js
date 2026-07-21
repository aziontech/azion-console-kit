import { describe, it, expect, vi } from 'vitest'
import {
  ACTION_META,
  metaFor,
  buildVersionMenuItems,
  mapVersionMenuItemsToMenu,
  getVersionBarActions
} from '@/composables/versioning/version-actions'
import { DEFAULT_CAPABILITY, VERSIONED_ONLY } from '@/composables/versioning/version-capability'

/**
 * Presentation-layer contract for version-actions.js. The existing
 * `version-menu-items.test.js` locks the item SET/ORDER/enablement of
 * `buildVersionMenuItems`; this file locks the literal presentation values the
 * mutation run proved were unasserted: every ACTION_META label/icon/dialog,
 * the row-menu labels+tooltips, the `mapVersionMenuItemsToMenu` command closure,
 * and the per-state action-bar buttons. Values are read literally from the
 * source on THIS branch — no snapshots, so a changed string fails for a reason.
 */

const ROLLBACK_DEFERRED_TOOLTIP =
  'Rollback depends on environment data and will be available in a later phase'
const BUILD_DISABLED_TOOLTIP = 'Only draft versions can be built'
const DEPLOY_DISABLED_TOOLTIP = 'Only Ready versions can be deployed'
const PROMOTE_DISABLED_TOOLTIP = 'Only Ready versions can be promoted'
const VERSIONED_ONLY_NEW_DRAFT_LABEL = 'New version from this'

describe('ACTION_META — literal presentation metadata per action', () => {
  it('SAVE is a plain label with no icon/danger/dialog', () => {
    expect(ACTION_META.SAVE).toEqual({ label: 'Save Draft' })
  })

  it('SAVE_AND_BUILD is a plain label', () => {
    expect(ACTION_META.SAVE_AND_BUILD).toEqual({ label: 'Save and Build' })
  })

  it('BUILD carries the cog icon', () => {
    expect(ACTION_META.BUILD).toEqual({ label: 'Build', icon: 'pi pi-cog' })
  })

  it('CANCEL_BUILD is danger with an optional-comment dialog', () => {
    expect(ACTION_META.CANCEL_BUILD).toEqual({
      label: 'Cancel Build',
      danger: true,
      dialog: {
        required: false,
        title: 'Cancel Build',
        actionLabel: 'Cancel Build',
        placeholder: 'Optional comment'
      }
    })
  })

  it('NEW_DRAFT_FROM is "Clone as Draft" with an optional-comment dialog', () => {
    expect(ACTION_META.NEW_DRAFT_FROM).toEqual({
      label: 'Clone as Draft',
      dialog: {
        required: false,
        title: 'Clone as Draft',
        actionLabel: 'Create Draft',
        placeholder: 'Optional comment'
      }
    })
  })

  it('OPEN_CONFIGURATION carries the sliders icon', () => {
    expect(ACTION_META.OPEN_CONFIGURATION).toEqual({
      label: 'Open configuration',
      icon: 'pi pi-sliders-h'
    })
  })

  it('PROMOTE carries the arrow icon', () => {
    expect(ACTION_META.PROMOTE).toEqual({
      label: 'Promote version',
      icon: 'pi pi-arrow-up-right'
    })
  })

  it('ROLLBACK carries the history icon', () => {
    expect(ACTION_META.ROLLBACK).toEqual({
      label: 'Rollback to this version',
      icon: 'pi pi-history'
    })
  })

  it('ARCHIVE carries the inbox icon and a REQUIRED-comment dialog', () => {
    expect(ACTION_META.ARCHIVE).toEqual({
      label: 'Archive',
      icon: 'pi pi-inbox',
      dialog: {
        required: true,
        title: 'Archive Version',
        actionLabel: 'Archive',
        placeholder: 'Reason for archiving (required)'
      }
    })
  })

  it('DELETE is danger with a confirmation dialog (no comment, danger severity)', () => {
    expect(ACTION_META.DELETE).toEqual({
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
    })
  })

  it('DEPLOY carries the cloud-upload icon', () => {
    expect(ACTION_META.DEPLOY).toEqual({ label: 'Deploy', icon: 'pi pi-cloud-upload' })
  })

  it('only CANCEL_BUILD and DELETE are marked danger', () => {
    const dangerActions = Object.keys(ACTION_META).filter((key) => ACTION_META[key].danger === true)
    expect(dangerActions).toEqual(['CANCEL_BUILD', 'DELETE'])
  })

  it('DELETE dialog explicitly suppresses the comment field', () => {
    expect(ACTION_META.DELETE.dialog.showComment).toBe(false)
  })

  it('ARCHIVE dialog requires a comment while CANCEL_BUILD/NEW_DRAFT_FROM do not', () => {
    expect(ACTION_META.ARCHIVE.dialog.required).toBe(true)
    expect(ACTION_META.CANCEL_BUILD.dialog.required).toBe(false)
    expect(ACTION_META.NEW_DRAFT_FROM.dialog.required).toBe(false)
  })
})

describe('metaFor', () => {
  it('returns the exact ACTION_META entry for a known action', () => {
    expect(metaFor('ARCHIVE')).toEqual(ACTION_META.ARCHIVE)
    expect(metaFor('DELETE')).toBe(ACTION_META.DELETE)
  })

  it('falls back to a label-only object echoing the action for an unknown action', () => {
    expect(metaFor('TOTALLY_UNKNOWN')).toEqual({ label: 'TOTALLY_UNKNOWN' })
  })

  it('does not synthesize a dialog/icon/danger for an unknown action', () => {
    const meta = metaFor('SOMETHING_ELSE')
    expect(meta.dialog).toBeUndefined()
    expect(meta.icon).toBeUndefined()
    expect(meta.danger).toBeUndefined()
  })
})

describe('buildVersionMenuItems — deployable presentation (labels/icons/tooltips)', () => {
  it('ready: full ordered item objects with literal labels, icons and tooltips', () => {
    const items = buildVersionMenuItems('ready', { resourceType: 'edge_application' })
    expect(items).toEqual([
      {
        action: 'OPEN_CONFIGURATION',
        label: 'Open configuration',
        icon: 'pi pi-sliders-h',
        disabled: false,
        tooltip: null,
        danger: false,
        separatorBefore: false
      },
      {
        action: 'BUILD',
        label: 'Build',
        icon: 'pi pi-cog',
        disabled: true,
        tooltip: BUILD_DISABLED_TOOLTIP,
        danger: false,
        separatorBefore: false
      },
      {
        action: 'DEPLOY',
        label: 'Deploy',
        icon: 'pi pi-cloud-upload',
        disabled: false,
        tooltip: null,
        danger: false,
        separatorBefore: false
      },
      {
        action: 'PROMOTE',
        label: 'Promote version',
        icon: 'pi pi-arrow-up-right',
        disabled: false,
        tooltip: null,
        danger: false,
        separatorBefore: false
      },
      {
        action: 'ROLLBACK',
        label: 'Rollback to this version',
        icon: 'pi pi-history',
        disabled: true,
        tooltip: ROLLBACK_DEFERRED_TOOLTIP,
        danger: false,
        separatorBefore: false
      },
      {
        action: 'ARCHIVE',
        label: 'Archive',
        icon: 'pi pi-inbox',
        disabled: false,
        tooltip: null,
        danger: false,
        separatorBefore: false
      },
      {
        action: 'DELETE',
        label: 'Delete',
        icon: 'pi pi-trash',
        disabled: false,
        tooltip: null,
        danger: true,
        separatorBefore: true
      }
    ])
  })

  it('draft: BUILD enabled (no tooltip); DEPLOY and PROMOTE disabled with their literal tooltips', () => {
    const items = buildVersionMenuItems('draft', { resourceType: 'edge_application' })
    const byAction = Object.fromEntries(items.map((entry) => [entry.action, entry]))

    expect(byAction.BUILD).toMatchObject({ disabled: false, tooltip: null })
    expect(byAction.DEPLOY).toMatchObject({ disabled: true, tooltip: DEPLOY_DISABLED_TOOLTIP })
    expect(byAction.PROMOTE).toMatchObject({ disabled: true, tooltip: PROMOTE_DISABLED_TOOLTIP })
    // Archive is disabled for draft but carries NO tooltip (override sets only `disabled`).
    expect(byAction.ARCHIVE).toMatchObject({ disabled: true, tooltip: null })
    // Rollback stays deferred regardless of state.
    expect(byAction.ROLLBACK).toMatchObject({ disabled: true, tooltip: ROLLBACK_DEFERRED_TOOLTIP })
  })

  it('deleted: DELETE omitted, all other items retain their labels', () => {
    const items = buildVersionMenuItems('deleted', { resourceType: 'edge_application' })
    expect(items.map((entry) => entry.label)).toEqual([
      'Open configuration',
      'Build',
      'Deploy',
      'Promote version',
      'Rollback to this version',
      'Archive'
    ])
  })
})

describe('buildVersionMenuItems — versioned-only presentation', () => {
  it('function resource: NEW_DRAFT_FROM replaces DEPLOY/PROMOTE/ROLLBACK with overridden label', () => {
    const items = buildVersionMenuItems('ready', { resourceType: 'function' })
    expect(items).toEqual([
      {
        action: 'OPEN_CONFIGURATION',
        label: 'Open configuration',
        icon: 'pi pi-sliders-h',
        disabled: false,
        tooltip: null,
        danger: false,
        separatorBefore: false
      },
      {
        action: 'BUILD',
        label: 'Build',
        icon: 'pi pi-cog',
        disabled: true,
        tooltip: BUILD_DISABLED_TOOLTIP,
        danger: false,
        separatorBefore: false
      },
      {
        action: 'NEW_DRAFT_FROM',
        label: VERSIONED_ONLY_NEW_DRAFT_LABEL,
        icon: null,
        disabled: false,
        tooltip: null,
        danger: false,
        separatorBefore: false
      },
      {
        action: 'ARCHIVE',
        label: 'Archive',
        icon: 'pi pi-inbox',
        disabled: false,
        tooltip: null,
        danger: false,
        separatorBefore: false
      },
      {
        action: 'DELETE',
        label: 'Delete',
        icon: 'pi pi-trash',
        disabled: false,
        tooltip: null,
        danger: true,
        separatorBefore: true
      }
    ])
  })

  it('the label override does NOT mutate ACTION_META.NEW_DRAFT_FROM (shell keeps "Clone as Draft")', () => {
    buildVersionMenuItems('ready', { resourceType: 'function' })
    expect(ACTION_META.NEW_DRAFT_FROM.label).toBe('Clone as Draft')
    expect(metaFor('NEW_DRAFT_FROM').label).toBe('Clone as Draft')
  })
})

describe('mapVersionMenuItemsToMenu — command closure + rendered menu model', () => {
  const buildMenu = (state, ctx, onAction, item) =>
    mapVersionMenuItemsToMenu(state, ctx, onAction, item)

  it('injects a native separator immediately before Delete', () => {
    const menu = buildMenu('ready', { resourceType: 'edge_application' }, vi.fn(), { id: 1 })
    const deleteIndex = menu.findIndex((entry) => entry.label === 'Delete')
    expect(deleteIndex).toBeGreaterThan(0)
    expect(menu[deleteIndex - 1]).toEqual({ separator: true })
    // Exactly one separator in the whole menu.
    expect(menu.filter((entry) => entry.separator === true)).toHaveLength(1)
  })

  it('produces exactly the 7 items + 1 separator, starting at Open configuration', () => {
    const menu = buildMenu('ready', { resourceType: 'edge_application' }, vi.fn(), { id: 1 })
    // 7 deployable items + 1 injected separator, no stray leading entry.
    expect(menu).toHaveLength(8)
    expect(menu[0].label).toBe('Open configuration')
  })

  it('resolves the default (deployable) capability when ctx is omitted', () => {
    const menu = buildMenu('ready', undefined, vi.fn(), { id: 1 })
    // Deployable menu → Deploy/Promote present; also proves no throw on missing ctx.
    expect(menu.map((entry) => entry.label)).toContain('Deploy')
    expect(menu.map((entry) => entry.label)).toContain('Promote version')
  })

  it('sets class "danger" only on the (enabled) Delete item, null elsewhere', () => {
    const menu = buildMenu('ready', { resourceType: 'edge_application' }, vi.fn(), { id: 1 })
    const deleteItem = menu.find((entry) => entry.label === 'Delete')
    const openItem = menu.find((entry) => entry.label === 'Open configuration')
    const disabledBuild = menu.find((entry) => entry.label === 'Build')

    expect(deleteItem.class).toBe('danger')
    expect(openItem.class).toBeNull()
    // Build is disabled and non-danger → class stays null.
    expect(disabledBuild.class).toBeNull()
  })

  it('forwards label/icon/disabled/tooltip onto each menu item', () => {
    const menu = buildMenu('ready', { resourceType: 'edge_application' }, vi.fn(), { id: 1 })
    const rollback = menu.find((entry) => entry.label === 'Rollback to this version')

    expect(rollback).toMatchObject({
      label: 'Rollback to this version',
      icon: 'pi pi-history',
      disabled: true,
      tooltip: ROLLBACK_DEFERRED_TOOLTIP
    })
    const deploy = menu.find((entry) => entry.label === 'Deploy')
    expect(deploy).toMatchObject({ icon: 'pi pi-cloud-upload', disabled: false, tooltip: null })
  })

  it('command() stops propagation and calls onAction with the exact {action, item}', () => {
    const onAction = vi.fn()
    const item = { id: 42, name: 'v3' }
    const menu = buildMenu('ready', { resourceType: 'edge_application' }, onAction, item)
    const deleteItem = menu.find((entry) => entry.label === 'Delete')
    const stopPropagation = vi.fn()

    deleteItem.command({ originalEvent: { stopPropagation } })

    expect(stopPropagation).toHaveBeenCalledTimes(1)
    expect(onAction).toHaveBeenCalledTimes(1)
    expect(onAction).toHaveBeenCalledWith({ action: 'DELETE', item })
  })

  it('command() forwards the action of the specific item invoked', () => {
    const onAction = vi.fn()
    const item = { id: 7 }
    const menu = buildMenu('ready', { resourceType: 'edge_application' }, onAction, item)
    const promote = menu.find((entry) => entry.label === 'Promote version')

    promote.command({ originalEvent: { stopPropagation: vi.fn() } })

    expect(onAction).toHaveBeenCalledWith({ action: 'PROMOTE', item })
  })

  it('command() tolerates a missing originalEvent and still calls onAction', () => {
    const onAction = vi.fn()
    const item = { id: 9 }
    const menu = buildMenu('ready', { resourceType: 'edge_application' }, onAction, item)
    const openItem = menu.find((entry) => entry.label === 'Open configuration')

    expect(() => openItem.command()).not.toThrow()
    expect(onAction).toHaveBeenCalledWith({ action: 'OPEN_CONFIGURATION', item })
  })

  it('command() tolerates an originalEvent without a stopPropagation method', () => {
    const onAction = vi.fn()
    const item = { id: 11 }
    const menu = buildMenu('ready', { resourceType: 'edge_application' }, onAction, item)
    const openItem = menu.find((entry) => entry.label === 'Open configuration')

    expect(() => openItem.command({ originalEvent: {} })).not.toThrow()
    expect(onAction).toHaveBeenCalledWith({ action: 'OPEN_CONFIGURATION', item })
  })

  it('command() tolerates a missing onAction handler without throwing', () => {
    const menu = buildMenu('ready', { resourceType: 'edge_application' }, undefined, { id: 12 })
    const openItem = menu.find((entry) => entry.label === 'Open configuration')
    const stopPropagation = vi.fn()

    expect(() => openItem.command({ originalEvent: { stopPropagation } })).not.toThrow()
    // Propagation is still stopped even when there is no handler.
    expect(stopPropagation).toHaveBeenCalledTimes(1)
  })
})

describe('getVersionBarActions — per-state button model (key/label/icon/emphasis)', () => {
  const SAVE = { key: 'SAVE', label: 'Save', icon: 'pi pi-save', emphasis: 'secondary' }
  const SAVE_AND_BUILD = {
    key: 'SAVE_AND_BUILD',
    label: 'Save and Build',
    icon: 'pi pi-cog',
    emphasis: 'primary'
  }
  const CANCEL_BUILD = {
    key: 'CANCEL_BUILD',
    label: 'Cancel Build',
    icon: 'pi pi-times',
    emphasis: 'secondary'
  }
  const NEW_VERSION = {
    key: 'NEW_DRAFT_FROM',
    label: 'New Version',
    icon: 'pi pi-plus',
    emphasis: 'secondary'
  }
  const DEPLOY = { key: 'DEPLOY', label: 'Deploy', icon: 'pi pi-cloud-upload', emphasis: 'primary' }
  const REDEPLOY = {
    key: 'DEPLOY',
    label: 'Redeploy',
    icon: 'pi pi-refresh',
    emphasis: 'secondary'
  }

  it.each(['draft', 'canceled', 'error'])(
    'editable state "%s" → [Save, Save and Build]',
    (state) => {
      expect(getVersionBarActions(state)).toEqual([SAVE, SAVE_AND_BUILD])
    }
  )

  it.each(['building', 'queued'])('processing state "%s" → [Cancel Build]', (state) => {
    expect(getVersionBarActions(state)).toEqual([CANCEL_BUILD])
  })

  it('ready → [New Version, Deploy]', () => {
    expect(getVersionBarActions('ready')).toEqual([NEW_VERSION, DEPLOY])
  })

  it('active → [New Version, Redeploy] (Deploy relabeled/re-iconed for active)', () => {
    expect(getVersionBarActions('active')).toEqual([NEW_VERSION, REDEPLOY])
  })

  it('archived → [New Version]', () => {
    expect(getVersionBarActions('archived')).toEqual([NEW_VERSION])
  })

  it('unknown state falls back to [New Version]', () => {
    expect(getVersionBarActions('totally-unknown')).toEqual([NEW_VERSION])
  })

  it('default capability keeps Deploy/Redeploy present', () => {
    expect(getVersionBarActions('ready', DEFAULT_CAPABILITY)).toEqual([NEW_VERSION, DEPLOY])
    expect(getVersionBarActions('active', DEFAULT_CAPABILITY)).toEqual([NEW_VERSION, REDEPLOY])
  })

  it('versioned-only capability drops Deploy in ready and Redeploy in active', () => {
    expect(getVersionBarActions('ready', VERSIONED_ONLY)).toEqual([NEW_VERSION])
    expect(getVersionBarActions('active', VERSIONED_ONLY)).toEqual([NEW_VERSION])
  })

  it('versioned-only capability leaves the non-gated New Version button untouched', () => {
    expect(getVersionBarActions('archived', VERSIONED_ONLY)).toEqual([NEW_VERSION])
    expect(getVersionBarActions('draft', VERSIONED_ONLY)).toEqual([SAVE, SAVE_AND_BUILD])
  })
})
