/**
 * @typedef {import('vue').Ref<boolean> | import('vue').ComputedRef<boolean> | (() => boolean)} DirtySource
 */

/**
 * @typedef {Object} UseUnsavedChangesOptions
 * @property {import('vue').Ref<boolean> | import('vue').ComputedRef<boolean>} [isReady]
 *   When false, dirty tracking is deferred (isDirty always returns false).
 *   Set to true once the form is fully loaded/initialized.
 *   Solves false-positive dirty detection after data load.
 * @property {boolean} [enableBeforeUnload=true] Enables window.beforeunload protection.
 * @property {boolean} [enableRouteGuard=true] Enables vue-router onBeforeRouteLeave guard.
 */

/**
 * @typedef {Object} UseUnsavedChangesReturn
 * @property {import('vue').ComputedRef<boolean>} isDirty Whether any registered dirty source is currently dirty AND the system is ready.
 * @property {import('vue').Ref<boolean>} isDialogVisible Whether the confirmation dialog should be visible.
 * @property {(source: DirtySource) => () => void} addDirtySource Register a dirty source. Returns an unregister function.
 * @property {() => void} disable Temporarily disable the guard (e.g., after successful submit).
 * @property {() => void} enable Re-enable the guard.
 * @property {import('vue').Ref<boolean>} isEnabled Whether the guard is currently enabled.
 * @property {() => void} confirmLeave Confirm leaving - executes the pending navigation/action.
 * @property {() => void} cancelLeave Cancel leaving - closes the dialog, stays on page.
 * @property {(action: () => void) => void} guardAction Programmatically trigger a leave attempt for a custom action.
 */

/**
 * @typedef {Object} TabUnsavedContext
 * @property {(fromIndex: number, toIndex: number) => void} requestTabChange Called by TabsView to attempt changing tabs with unsaved guard.
 * @property {UseUnsavedChangesReturn} unsaved The composable return, so child forms can register dirty sources.
 */

/**
 * @typedef {Object} DrawerUnsavedContext
 * @property {() => void} requestClose Called by drawer wrapper to attempt closing with unsaved guard.
 * @property {UseUnsavedChangesReturn} unsaved The composable return, so child forms can register dirty sources.
 */

/** @type {import('vue').InjectionKey<TabUnsavedContext>} */
export const TAB_UNSAVED_KEY = Symbol('tab-unsaved')

/** @type {import('vue').InjectionKey<DrawerUnsavedContext>} */
export const DRAWER_UNSAVED_KEY = Symbol('drawer-unsaved')
