import { ref, computed, toValue } from 'vue'
import { useToast } from '@aziontech/webkit/use-toast'
import { metaFor } from '@/composables/versioning/version-actions'

/**
 * Handles the management actions (Clone / Archive / Delete) a version list row
 * can trigger, emitted by `VersionListDataView`'s `row-action` event.
 *
 * Actions that carry a dialog (comment or confirmation) open `VersionActionDialog`
 * first; otherwise they run immediately. Execution goes DIRECTLY through the
 * version service — the VersionShell command bus is shell-scoped and is not
 * available here (and the list manages many versions, not one). Each service
 * mutation already invalidates the vue-query cache, so the list refetches with
 * no extra work.
 *
 * @param {object} cfg
 * @param {import('vue').MaybeRefOrGetter<string>} cfg.resourceId application id (ref/getter/plain)
 * @param {object} cfg.service version service exposing deleteVersion/archive/createDraft/cancelBuild
 * @param {(newVersionId: string) => void} [cfg.onCloned] called after a successful clone (e.g. navigate)
 * @param {() => void} [cfg.onSuccess] called after a successful non-navigating action, so the
 *   consuming view can reload the list and reflect the new version status
 * @returns dialog state + handlers to wire into the view and VersionActionDialog
 */
export function useVersionRowActions({ resourceId, service, onCloned, onSuccess } = {}) {
  const toast = useToast()

  const dialogVisible = ref(false)
  const pendingAction = ref(null)
  const pendingItem = ref(null)
  const isExecuting = ref(false)

  // Raw dialog meta for the pending action (or null when none is pending).
  const dialogConfig = computed(() =>
    pendingAction.value ? (metaFor(pendingAction.value).dialog ?? null) : null
  )

  // Maps the shared dialog meta to VersionActionDialog props.
  const dialogProps = computed(() => {
    const cfg = dialogConfig.value
    if (!cfg) return {}
    return {
      title: cfg.title,
      actionLabel: cfg.actionLabel,
      requireComment: cfg.required ?? false,
      placeholder: cfg.placeholder,
      message: cfg.message,
      showComment: cfg.showComment ?? true,
      confirmSeverity: cfg.confirmSeverity
    }
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

  const execute = async (action, item, comment) => {
    const rid = toValue(resourceId)
    switch (action) {
      case 'BUILD':
        return service.build(rid, item.id, {})
      case 'DELETE':
        return service.deleteVersion(rid, item.id)
      case 'ARCHIVE':
        return service.archive(rid, item.id, { comment })
      case 'CANCEL_BUILD':
        return service.cancelBuild(rid, item.id, { comment })
      case 'NEW_DRAFT_FROM': {
        const draft = await service.createDraft(rid, { sourceVersionId: item.id, comment })
        if (draft?.id) onCloned?.(draft.id)
        return draft
      }
      default:
        return undefined
    }
  }

  const run = async (action, item, comment) => {
    if (isExecuting.value) return
    isExecuting.value = true
    try {
      await execute(action, item, comment)
      // NEW_DRAFT_FROM navigates away (via onCloned); every other action stays
      // on the list, so reload it to reflect the new version status.
      if (action !== 'NEW_DRAFT_FROM') onSuccess?.()
    } catch (err) {
      const verb = metaFor(action).label?.toLowerCase?.() ?? 'run'
      reportError(err, `Failed to ${verb} the version. Try again.`)
    } finally {
      isExecuting.value = false
    }
  }

  const handleRowAction = ({ action, item } = {}) => {
    if (!action || !item) return
    if (metaFor(action).dialog) {
      pendingAction.value = action
      pendingItem.value = item
      dialogVisible.value = true
      return
    }
    run(action, item, '')
  }

  const handleConfirm = (comment) => {
    const action = pendingAction.value
    const item = pendingItem.value
    if (!action || !item) return
    dialogVisible.value = false
    pendingAction.value = null
    pendingItem.value = null
    run(action, item, comment)
  }

  const handleVisibility = (value) => {
    dialogVisible.value = value
    if (!value) {
      pendingAction.value = null
      pendingItem.value = null
    }
  }

  return {
    handleRowAction,
    dialogConfig,
    dialogProps,
    dialogVisible,
    isExecuting,
    handleConfirm,
    handleVisibility
  }
}
