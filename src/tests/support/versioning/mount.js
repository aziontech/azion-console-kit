import { mount } from '@vue/test-utils'
import { readonly, ref } from 'vue'
import { VERSION_CONTEXT_KEY } from '@/composables/versioning/use-version-context'
import {
  VERSION_COMMAND_BUS_KEY,
  createVersionCommandBus
} from '@/composables/versioning/use-version-command-bus'
import { DEFAULT_CAPABILITY } from '@/composables/versioning/version-capability'

/**
 * Test-kit — mounting versioned surfaces against the REAL provide/inject keys.
 *
 * The shell's context (`VERSION_CONTEXT_KEY`) and command bus
 * (`VERSION_COMMAND_BUS_KEY`) were previously re-provided ad hoc in ~16 files.
 * This module exposes them once, with the same default shape `useVersionContext`
 * falls back to, so tabs/forms mount identically everywhere. The bus is the REAL
 * `createVersionCommandBus` — never a mock of the versioning code.
 */

// Re-export so tests wire the real bus without reaching into production paths.
export { createVersionCommandBus, VERSION_COMMAND_BUS_KEY, VERSION_CONTEXT_KEY }

/**
 * Builds the version-context object provided under `VERSION_CONTEXT_KEY`, mirroring
 * the safe default shape `useVersionContext` injects outside the shell. Pass
 * `overrides` to move a surface into a specific state (e.g. `{ readOnly: true }`).
 *
 * Scalar overrides are wrapped in a `ref` to match the reactive contract consumers
 * read (`ctx.readOnly.value`); `capability` and `dispatch` are passed through as-is.
 *
 * @param {object} [overrides] partial context; keys override the defaults below
 * @returns {Record<symbol, object>} a `global.provide` fragment keyed by
 *   `VERSION_CONTEXT_KEY`, ready to spread into a mount's `global.provide`
 */
export const provideVersionContext = (overrides = {}) => {
  const asRef = (value) =>
    value && typeof value === 'object' && 'value' in value ? value : ref(value)

  const context = {
    state: asRef(overrides.state ?? 'draft'),
    readOnly: asRef(overrides.readOnly ?? false),
    version: asRef(overrides.version ?? null),
    availableActions: asRef(overrides.availableActions ?? []),
    disabledActions: asRef(overrides.disabledActions ?? []),
    isDispatching: asRef(overrides.isDispatching ?? false),
    isVersioned: asRef(overrides.isVersioned ?? false),
    capability: overrides.capability ?? DEFAULT_CAPABILITY,
    dispatch: overrides.dispatch ?? (async () => {})
  }

  return { [VERSION_CONTEXT_KEY]: context }
}

/**
 * Provides a real command bus under `VERSION_COMMAND_BUS_KEY`. Children register
 * handlers through the production `use-version-command` path against this bus, so
 * registration/emission run for real.
 *
 * @param {ReturnType<typeof createVersionCommandBus>} [bus] an existing bus to reuse
 * @returns {{ bus: ReturnType<typeof createVersionCommandBus>, provide: Record<symbol, object> }}
 */
export const provideVersionCommandBus = (bus = createVersionCommandBus()) => ({
  bus,
  provide: { [VERSION_COMMAND_BUS_KEY]: bus }
})

/**
 * Mounts a component inside a real version-context (and optionally a real command
 * bus). Thin wrapper over `@vue/test-utils` `mount` that merges the kit's provides
 * into `global.provide`.
 *
 * @param {object} component the component under test
 * @param {object} [options]
 * @param {object} [options.props] component props
 * @param {object} [options.contextOverrides] forwarded to `provideVersionContext`
 * @param {ReturnType<typeof createVersionCommandBus>} [options.bus] real bus to provide; omit to skip
 * @param {object} [options.global] extra `global` mount options (merged; provides combined)
 * @returns {import('@vue/test-utils').VueWrapper} the mounted wrapper
 */
export const mountWithVersionContext = (component, options = {}) => {
  const { props, contextOverrides, bus, global: extraGlobal = {} } = options

  const provide = {
    ...provideVersionContext(contextOverrides),
    ...(bus ? provideVersionCommandBus(bus).provide : {}),
    ...(extraGlobal.provide ?? {})
  }

  return mount(component, {
    props,
    ...(options.slots ? { slots: options.slots } : {}),
    global: { ...extraGlobal, provide }
  })
}

/**
 * A frozen, read-only version-context fragment (no overrides) for the common case
 * of "just provide a sane default context".
 */
export const defaultVersionContext = () => provideVersionContext({ readOnly: readonly(ref(false)) })
