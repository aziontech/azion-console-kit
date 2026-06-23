import { toValue } from 'vue'
import { useToast } from '@aziontech/webkit/use-toast'
import { useVersionRowActions } from '@/composables/versioning/use-version-row-actions'

/**
 * SINGLE shared router for the 5 version row-menu actions, consumed identically
 * by every listing (spec version-actions-menu §3.3, Req 1.4/10.1). Receives the
 * `{ action, item }` payload emitted by `VersionListDataView`'s `row-action` and
 * routes it:
 *   - OPEN_CONFIGURATION → router.push to the version editor of `resourceType`
 *     (RESOURCE_VERSION_ROUTES map), passing id + versionId; no draft creation.
 *   - PROMOTE            → openPromoteDrawer({ scopedType, pin, workloadId }).
 *   - NEW_DRAFT_FROM     → versionService.createDraft(resourceId,
 *     { sourceVersionId: item.id }) then route to the new draft (versioned-only).
 *   - ROLLBACK           → no-op (disabled this phase; behavior is Phase 2).
 *   - ARCHIVE / DELETE   → delegated to use-version-row-actions (dialog + service
 *     + toast). Its dialog state/handlers are re-exposed so the host renders
 *     VersionActionDialog unchanged.
 *
 * Holds no I/O nor DOM beyond `router.push`; mutations and their error/toast
 * handling stay in use-version-row-actions; the menu model stays in
 * version-actions.js.
 */

/**
 * Maps each version `resourceType` to its named version-editor route (§3.7).
 * Open configuration navigates here with `{ id, versionId }` params.
 */
export const RESOURCE_VERSION_ROUTES = {
  application: 'edit-application-version',
  firewall: 'edit-firewall-version',
  custom_page: 'edit-custom-pages-version',
  function: 'edit-functions-version',
  connector: 'edit-connectors-version',
  workload: 'edit-workload-version',
  network_list: 'edit-network-lists-version',
  waf: 'edit-waf-rules-version'
}

/**
 * @param {object} cfg
 * @param {import('vue').MaybeRefOrGetter<string>} cfg.resourceType resource kind (key of RESOURCE_VERSION_ROUTES)
 * @param {import('vue').MaybeRefOrGetter<string|number>} cfg.resourceId owning resource id
 * @param {object} cfg.versionService version service (deleteVersion/archive) forwarded to row-actions
 * @param {import('vue-router').Router} cfg.router router used for OPEN_CONFIGURATION
 * @param {(payload: { scopedType: string, pin: string|number, workloadId?: string|number }) => void} [cfg.openPromoteDrawer]
 *   opens the New Release drawer pinned to the version (host-supplied)
 * @param {() => void} [cfg.onSuccess] forwarded to row-actions so the host refreshes the list
 * @param {import('vue').MaybeRefOrGetter<string|number>} [cfg.workloadId] workload context for Promote
 * @returns row-action handler + the row-actions dialog state/handlers to wire into VersionActionDialog
 */
export function useVersionMenuActions({
  resourceType,
  resourceId,
  versionService,
  router,
  openPromoteDrawer,
  onSuccess,
  workloadId
} = {}) {
  const toast = useToast()
  const rowActions = useVersionRowActions({
    resourceId,
    service: versionService,
    onSuccess
  })

  // Open configuration: navigate to the version editor; no draft creation.
  const openConfiguration = (item) => {
    const type = toValue(resourceType)
    const name = RESOURCE_VERSION_ROUTES[type]
    if (!name || !item?.id) return
    router?.push({ name, params: { id: String(toValue(resourceId)), versionId: String(item.id) } })
  }

  // Promote: hand off to the host-supplied drawer opener, pinning this version.
  const promote = (item) => {
    if (!item?.id || typeof openPromoteDrawer !== 'function') return
    openPromoteDrawer({
      scopedType: toValue(resourceType),
      pin: item.id,
      workloadId: toValue(workloadId)
    })
  }

  // New version from this: clone the source version into a draft, then route to
  // it (mirror of VersionsTab.createDraft). Errors surface via toast, as elsewhere.
  const newDraftFrom = async (item) => {
    const type = toValue(resourceType)
    const name = RESOURCE_VERSION_ROUTES[type]
    if (!item?.id || !name) return
    try {
      const draft = await versionService.createDraft(toValue(resourceId), {
        sourceVersionId: item.id
      })
      if (draft?.id) {
        router?.push({
          name,
          params: { id: String(toValue(resourceId)), versionId: String(draft.id) }
        })
      }
    } catch (err) {
      if (err && typeof err.showErrors === 'function') {
        err.showErrors(toast)
      } else {
        toast.add({
          closable: true,
          severity: 'error',
          summary: 'Error',
          detail: err?.message ?? 'Failed to create a new version. Try again.'
        })
      }
    }
  }

  // Routes a `row-action` payload. ARCHIVE/DELETE keep their dialog+service+toast
  // flow inside use-version-row-actions; ROLLBACK is deferred (no-op this phase).
  const handleRowAction = ({ action, item } = {}) => {
    switch (action) {
      case 'OPEN_CONFIGURATION':
        return openConfiguration(item)
      case 'PROMOTE':
        return promote(item)
      case 'NEW_DRAFT_FROM':
        return newDraftFrom(item)
      case 'ROLLBACK':
        return undefined
      case 'ARCHIVE':
      case 'DELETE':
        return rowActions.handleRowAction({ action, item })
      default:
        return undefined
    }
  }

  return {
    handleRowAction,
    // Re-exposed from use-version-row-actions so the host renders VersionActionDialog.
    dialogConfig: rowActions.dialogConfig,
    dialogProps: rowActions.dialogProps,
    dialogVisible: rowActions.dialogVisible,
    isExecuting: rowActions.isExecuting,
    handleConfirm: rowActions.handleConfirm,
    handleVisibility: rowActions.handleVisibility
  }
}
