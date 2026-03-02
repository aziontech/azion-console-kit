import { provide, inject } from 'vue'
import { useUnsavedChanges } from './useUnsavedChanges'
import { TAB_UNSAVED_KEY } from './unsaved-changes.types'

/**
 * Used in TabsView to provide unsaved context to child tab forms.
 * Intercepts tab changes via guardAction - if dirty, shows dialog.
 *
 * @param {(index: number) => void} changeTabFn
 * @returns {import('./unsaved-changes.types').TabUnsavedContext}
 */
export function provideTabUnsaved(changeTabFn) {
  const unsaved = useUnsavedChanges({
    enableRouteGuard: true,
    enableBeforeUnload: true
  })

  const requestTabChange = (_fromIndex, toIndex) => {
    unsaved.guardAction(() => {
      changeTabFn(toIndex)
    })
  }

  const context = {
    requestTabChange,
    unsaved
  }

  provide(TAB_UNSAVED_KEY, context)
  return context
}

/**
 * Used in child edit forms within a TabsView to:
 * 1. Register their form dirty state as a dirty source
 * 2. Access the unsaved composable for dialog rendering
 *
 * @returns {import('./unsaved-changes.types').TabUnsavedContext | undefined}
 */
export function useTabUnsaved() {
  return inject(TAB_UNSAVED_KEY, undefined)
}
