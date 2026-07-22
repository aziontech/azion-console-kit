import { toValue } from 'vue'
import { useToast } from '@aziontech/webkit/use-toast'
import { useVersionRowActions } from '@/composables/versioning/use-version-row-actions'
import { releaseComposerRouteFromResource } from '@/templates/release-composition/release-composer-route'

export const RESOURCE_VERSION_ROUTES = {
  application: 'edit-application-version',
  firewall: 'edit-firewall-version',
  custom_page: 'edit-custom-pages-version',
  function: 'edit-functions-version',
  connector: 'edit-connectors-version',
  workload: 'edit-workload-version',
  network_list: 'edit-network-lists-version',
  waf: 'edit-waf-rules-version',
  deployment: 'edit-deployment-version'
}

export const AUTO_BUILD_ON_SAVE = new Set(['workload'])

/**
 * @param {object} cfg
 * @param {import('vue').MaybeRefOrGetter<string>} cfg.resourceType
 * @param {import('vue').MaybeRefOrGetter<string|number>} cfg.resourceId
 * @param {object} cfg.versionService
 * @param {import('vue-router').Router} cfg.router
 * @param {(payload: { scopedType: string, pin: string|number, workloadId?: string|number }) => void} [cfg.openPromoteDrawer]
 * @param {() => void} [cfg.onSuccess]
 * @param {import('vue').MaybeRefOrGetter<string|number>} [cfg.workloadId]
 * @returns
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

  const reportError = (err, fallback) => {
    if (err && typeof err.showErrors === 'function') {
      err.showErrors(toast)
    } else {
      toast.add({
        closable: true,
        severity: 'error',
        summary: 'Error',
        detail: err?.message ?? fallback
      })
    }
  }

  const openConfiguration = (item) => {
    const type = toValue(resourceType)
    const name = RESOURCE_VERSION_ROUTES[type]
    if (!name || !item?.id) return
    router?.push({ name, params: { id: String(toValue(resourceId)), versionId: String(item.id) } })
  }

  const promote = (item) => {
    if (!item?.id || typeof openPromoteDrawer !== 'function') return
    openPromoteDrawer({
      scopedType: toValue(resourceType),
      pin: item.id,
      workloadId: toValue(workloadId)
    })
  }

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
      reportError(err, 'Failed to create a new version. Try again.')
    }
  }

  const build = async (item) => {
    const type = toValue(resourceType)
    if (!item?.id) return
    if (AUTO_BUILD_ON_SAVE.has(type)) {
      const name = RESOURCE_VERSION_ROUTES[type]
      if (!name) return
      router?.push({
        name,
        params: { id: String(toValue(resourceId)), versionId: String(item.id) },
        query: { intent: 'build' }
      })
      return
    }
    if (typeof versionService?.build !== 'function') return
    try {
      await versionService.build(toValue(resourceId), item.id)
      toast.add({
        closable: true,
        severity: 'success',
        summary: 'Success',
        detail: 'Build started.'
      })
      onSuccess?.()
    } catch (err) {
      reportError(err, 'Failed to build the version. Try again.')
    }
  }

  const deploy = (item) => {
    if (!item?.id) return
    router?.push(
      releaseComposerRouteFromResource({
        resourceType: toValue(resourceType),
        resourceId: toValue(resourceId),
        version: { id: item.id }
      })
    )
  }

  const handleRowAction = ({ action, item } = {}) => {
    switch (action) {
      case 'OPEN_CONFIGURATION':
        return openConfiguration(item)
      case 'BUILD':
        return build(item)
      case 'DEPLOY':
        return deploy(item)
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
    dialogConfig: rowActions.dialogConfig,
    dialogProps: rowActions.dialogProps,
    dialogVisible: rowActions.dialogVisible,
    isExecuting: rowActions.isExecuting,
    handleConfirm: rowActions.handleConfirm,
    handleVisibility: rowActions.handleVisibility
  }
}
