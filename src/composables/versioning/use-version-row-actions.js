import { ref, computed, toValue } from 'vue'
import { useToast } from '@aziontech/webkit/use-toast'
import { metaFor } from '@/composables/versioning/version-actions'

/**
 * Handles the row-menu management actions (Archive / Delete) emitted by
 * `VersionListDataView`'s `row-action` event. Clone/Build are NOT routed here —
 * they live in the shell action bar, not the row menu (spec version-actions-menu
 * §3.4). ARCHIVE runs immediately (no modal) with a success toast; DELETE opens
 * a destructive confirmation dialog first.
 *
 * Execution goes DIRECTLY through the version service — the VersionShell command
 * bus is shell-scoped and is not available here (and the list manages many
 * versions, not one). Each service mutation already invalidates the vue-query
 * cache, so the list refetches with no extra work. The backend stays the
 * authority on "in use as Current": its rejection surfaces as an error toast.
 *
 * @param {object} cfg
 * @param {import('vue').MaybeRefOrGetter<string>} cfg.resourceId application id (ref/getter/plain)
 * @param {object} cfg.service version service exposing deleteVersion/archive
 * @param {() => void} [cfg.onSuccess] called after a successful action, so the
 *   consuming view can reload the list and reflect the new version status
 * @returns dialog state + handlers to wire into the view and VersionActionDialog
 */
// Default archive note: the row-menu Archive runs without a modal (Req 5.2),
// but the version service requires a non-empty comment — supply a stable one.
const DEFAULT_ARCHIVE_COMMENT = 'Archived from the versions list'

export function useVersionRowActions({ resourceId, service, onSuccess } = {}) {
  const toast = useToast()

  const dialogVisible = ref(false)
  const pendingAction = ref(null)
  const pendingItem = ref(null)
  const isExecuting = ref(false)

  const dialogConfig = computed(() =>
    pendingAction.value ? (metaFor(pendingAction.value).dialog ?? null) : null
  )

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

  // Only Archive/Delete reach the row-action path; everything else is a no-op
  // here (Clone/Build stay in the shell action bar).
  const execute = async (action, item) => {
    const rid = toValue(resourceId)
    switch (action) {
      case 'DELETE':
        return service.deleteVersion(rid, item.id)
      case 'ARCHIVE':
        return service.archive(rid, item.id, { comment: DEFAULT_ARCHIVE_COMMENT })
      default:
        return undefined
    }
  }

  const notifySuccess = (action) => {
    if (action !== 'ARCHIVE') return
    toast.add({
      closable: true,
      severity: 'success',
      summary: 'Success',
      detail: 'Version archived.'
    })
  }

  // The backend is the authority on "in use as Current". We mutate, then react:
  // success toast + view reload run ONLY after the API confirms. A rejection
  // (e.g. in use) surfaces the returned error and leaves the list untouched —
  // no optimistic remove/archive, no navigation (Req 3.1, 3.2, 3.4).
  const run = async (action, item) => {
    if (isExecuting.value) return
    isExecuting.value = true
    try {
      await execute(action, item)
    } catch (err) {
      const verb = metaFor(action).label?.toLowerCase?.() ?? 'run'
      reportError(err, `Failed to ${verb} the version. Try again.`)
      return
    } finally {
      isExecuting.value = false
    }
    // Post-confirmation view sync — outside the mutation try so a failing
    // reload never reads as the action itself having failed.
    notifySuccess(action)
    onSuccess?.()
  }

  // DELETE opens the destructive confirm dialog; ARCHIVE runs with no modal.
  const handleRowAction = ({ action, item } = {}) => {
    if (action !== 'ARCHIVE' && action !== 'DELETE') return
    if (!item) return
    if (action === 'DELETE') {
      pendingAction.value = action
      pendingItem.value = item
      dialogVisible.value = true
      return
    }
    run(action, item)
  }

  const handleConfirm = () => {
    const action = pendingAction.value
    const item = pendingItem.value
    if (!action || !item) return
    dialogVisible.value = false
    pendingAction.value = null
    pendingItem.value = null
    run(action, item)
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
