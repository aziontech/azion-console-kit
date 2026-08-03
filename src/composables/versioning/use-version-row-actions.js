import { ref, computed, toValue } from 'vue'
import { useToast } from '@aziontech/webkit/use-toast'
import { metaFor } from '@/composables/versioning/version-actions'

/**
 * @param {object} cfg
 * @param {import('vue').MaybeRefOrGetter<string>} cfg.resourceId
 * @param {object} cfg.service
 * @param {() => void} [cfg.onSuccess]
 * @returns
 */
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
    notifySuccess(action)
    onSuccess?.()
  }

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
