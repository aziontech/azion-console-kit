import { inject, readonly, ref } from 'vue'
import { DEFAULT_CAPABILITY } from '@/composables/versioning/version-capability'

export const VERSION_CONTEXT_KEY = Symbol('versionContext')

/**
 * @returns {{
 * state: import('vue').Ref<string>,
 * readOnly: import('vue').ComputedRef<boolean> | { value: boolean },
 * version: import('vue').Ref<object|null>,
 * availableActions: import('vue').Ref<string[]>,
 * disabledActions: import('vue').Ref<string[]>,
 * isDispatching: import('vue').Ref<boolean> | { value: boolean },
 * isVersioned: import('vue').Ref<boolean>,
 * capability: {canDeploy: boolean, canPromote: boolean, canRollback: boolean},
 * dispatch: (action: string, payload?: object) => Promise<any>
 * }}
 */
export const useVersionContext = () => {
  return inject(VERSION_CONTEXT_KEY, {
    state: readonly(ref('draft')),
    readOnly: readonly(ref(false)),
    version: readonly(ref(null)),
    availableActions: readonly(ref([])),
    disabledActions: readonly(ref([])),
    isDispatching: readonly(ref(false)),
    isVersioned: readonly(ref(false)),
    capability: DEFAULT_CAPABILITY,
    dispatch: async () => {}
  })
}
