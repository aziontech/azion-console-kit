import { provide, inject } from 'vue'
import { useUnsavedChanges } from './useUnsavedChanges'
import { DRAWER_UNSAVED_KEY } from './unsaved-changes.types'

/**
 * Used in drawer wrapper components (edit-drawer-block, create-drawer-block).
 * Intercepts drawer close attempts via guardAction when form is dirty.
 *
 * @param {() => void} closeFn
 * @param {import('vue').Ref<boolean>} [isReady]
 * @returns {import('./unsaved-changes.types').DrawerUnsavedContext}
 */
export function provideDrawerUnsaved(closeFn, isReady) {
  const unsaved = useUnsavedChanges({
    isReady,
    enableRouteGuard: false,
    enableBeforeUnload: true
  })

  const requestClose = () => {
    unsaved.guardAction(() => {
      closeFn()
    })
  }

  const context = {
    requestClose,
    unsaved
  }

  provide(DRAWER_UNSAVED_KEY, context)
  return context
}

/**
 * Used by child components within a drawer to register dirty sources.
 *
 * @returns {import('./unsaved-changes.types').DrawerUnsavedContext | undefined}
 */
export function useDrawerUnsaved() {
  return inject(DRAWER_UNSAVED_KEY, undefined)
}
