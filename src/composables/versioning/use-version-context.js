import { inject, readonly, ref } from 'vue'

/**
 * Provide/inject key used by the VersionShell to expose the current version
 * context (state, readOnly, raw version) to nested tabs and form fields.
 */
export const VERSION_CONTEXT_KEY = Symbol('versionContext')

/**
 * Consumed by tabs/forms rendered inside the VersionShell.
 * Returns a safe default shape when mounted outside the shell, so legacy views
 * or storybook stories don't break.
 *
 * @returns {{
 *   state: import('vue').Ref<string>,
 *   readOnly: import('vue').ComputedRef<boolean> | { value: boolean },
 *   version: import('vue').Ref<object|null>
 * }}
 */
export const useVersionContext = () => {
  // Real refs (not plain `{ value }` objects) so consumers behave identically
  // whether mounted inside the shell (which provides actual refs) or standalone
  // on this default — both auto-unwrap in templates and expose `.value` in scripts.
  return inject(VERSION_CONTEXT_KEY, {
    state: readonly(ref('draft')),
    readOnly: readonly(ref(false)),
    version: readonly(ref(null))
  })
}
