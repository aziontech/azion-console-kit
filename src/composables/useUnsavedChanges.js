import { ref, computed, watch, onBeforeUnmount, toValue, shallowRef } from 'vue'
import { onBeforeRouteLeave, useRouter } from 'vue-router'

/**
 * Core composable for unsaved changes detection.
 * Handles dirty tracking, route guard, beforeunload, and dialog control.
 *
 * @param {import('./unsaved-changes.types').UseUnsavedChangesOptions} [options={}]
 * @returns {import('./unsaved-changes.types').UseUnsavedChangesReturn}
 */
export function useUnsavedChanges(options = {}) {
  const { isReady, enableBeforeUnload = true, enableRouteGuard = true } = options

  const router = useRouter()

  const dirtySources = shallowRef(new Set())
  const isEnabled = ref(true)
  const isDialogVisible = ref(false)

  let pendingAction = null
  let pendingRoutePath = null
  let bypassGuard = false

  const isDirty = computed(() => {
    if (!isEnabled.value) return false
    if (isReady && !toValue(isReady)) return false

    for (const source of dirtySources.value) {
      const value =
        typeof source === 'function' && !('value' in source) ? source() : toValue(source)
      if (value) return true
    }
    return false
  })

  const addDirtySource = (source) => {
    const newSet = new Set(dirtySources.value)
    newSet.add(source)
    dirtySources.value = newSet

    return () => {
      const updated = new Set(dirtySources.value)
      updated.delete(source)
      dirtySources.value = updated
    }
  }

  const disable = () => {
    isEnabled.value = false
  }

  const enable = () => {
    isEnabled.value = true
  }

  const confirmLeave = () => {
    isDialogVisible.value = false

    if (pendingRoutePath) {
      const path = pendingRoutePath
      pendingRoutePath = null
      bypassGuard = true
      router.push(path)
    } else if (pendingAction) {
      const action = pendingAction
      pendingAction = null
      bypassGuard = true
      action()
    }
  }

  const cancelLeave = () => {
    isDialogVisible.value = false
    pendingAction = null
    pendingRoutePath = null
  }

  const guardAction = (action) => {
    if (!isDirty.value) {
      action()
      return
    }
    pendingAction = action
    pendingRoutePath = null
    isDialogVisible.value = true
  }

  if (enableRouteGuard) {
    onBeforeRouteLeave((to, _from, next) => {
      if (bypassGuard) {
        bypassGuard = false
        return next()
      }
      if (!isDirty.value) {
        return next()
      }
      pendingRoutePath = to.fullPath
      pendingAction = null
      isDialogVisible.value = true
      return next(false)
    })
  }

  if (enableBeforeUnload) {
    const handleBeforeUnload = (event) => {
      if (isDirty.value) {
        event.preventDefault()
      }
    }

    const stopWatch = watch(isDirty, (dirty) => {
      if (dirty) {
        window.addEventListener('beforeunload', handleBeforeUnload)
      } else {
        window.removeEventListener('beforeunload', handleBeforeUnload)
      }
    })

    onBeforeUnmount(() => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      stopWatch()
    })
  }

  return {
    isDirty,
    isDialogVisible,
    addDirtySource,
    disable,
    enable,
    isEnabled,
    confirmLeave,
    cancelLeave,
    guardAction
  }
}
