import { inject, readonly, ref } from 'vue'

/**
 * Provide/inject key used by the VersionShell to expose the current version
 * context (state, readOnly, raw version) to nested tabs and form fields.
 */
export const VERSION_CONTEXT_KEY = Symbol('versionContext')

/**
 * Consumed by tabs/forms rendered inside the VersionShell; returns a safe default
 * shape when mounted outside it so legacy views and stories don't break.
 *
 * `dispatch` plus `availableActions`/`disabledActions` let a descendant teleported
 * out of the shell trigger and gate lifecycle commands through the shell's single
 * source of truth. `isVersioned` is true only inside the shell — shared tabs use it
 * to drop layout the shell already provides (e.g. the `isTabs` top margin).
 *
 * @returns {{
 *   state: import('vue').Ref<string>,
 *   readOnly: import('vue').ComputedRef<boolean> | { value: boolean },
 *   version: import('vue').Ref<object|null>,
 *   availableActions: import('vue').Ref<string[]>,
 *   disabledActions: import('vue').Ref<string[]>,
 *   isVersioned: import('vue').Ref<boolean>,
 *   dispatch: (action: string, payload?: object) => Promise<any>
 * }}
 */
export const useVersionContext = () => {
  // Real refs (not plain `{ value }`) so consumers behave identically whether the
  // shell provides them or they fall back to this default.
  return inject(VERSION_CONTEXT_KEY, {
    state: readonly(ref('draft')),
    readOnly: readonly(ref(false)),
    version: readonly(ref(null)),
    availableActions: readonly(ref([])),
    disabledActions: readonly(ref([])),
    // Default = standalone/legacy mount: no version shell above us.
    isVersioned: readonly(ref(false)),
    dispatch: async () => {}
  })
}
