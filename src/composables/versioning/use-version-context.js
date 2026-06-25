import { inject, readonly, ref } from 'vue'
import { DEFAULT_CAPABILITY } from '@/composables/versioning/version-capability'

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
 * `capability` is the resource class `{ canDeploy, canPromote, canRollback }`; it
 * defaults to `DEFAULT_CAPABILITY` (deployable) when consumed outside the shell.
 *
 * @returns {{
 *   state: import('vue').Ref<string>,
 *   readOnly: import('vue').ComputedRef<boolean> | { value: boolean },
 *   version: import('vue').Ref<object|null>,
 *   availableActions: import('vue').Ref<string[]>,
 *   disabledActions: import('vue').Ref<string[]>,
 *   isVersioned: import('vue').Ref<boolean>,
 *   capability: {canDeploy: boolean, canPromote: boolean, canRollback: boolean},
 *   dispatch: (action: string, payload?: object) => Promise<any>
 * }}
 */
export const useVersionContext = () => {
  return inject(VERSION_CONTEXT_KEY, {
    state: readonly(ref('draft')),
    readOnly: readonly(ref(false)),
    version: readonly(ref(null)),
    availableActions: readonly(ref([])),
    disabledActions: readonly(ref([])),
    isVersioned: readonly(ref(false)),
    capability: DEFAULT_CAPABILITY,
    dispatch: async () => {}
  })
}
