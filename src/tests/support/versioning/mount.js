import { mount } from '@vue/test-utils'
import { readonly, ref } from 'vue'
import { VERSION_CONTEXT_KEY } from '@/composables/versioning/use-version-context'
import {
  VERSION_COMMAND_BUS_KEY,
  createVersionCommandBus
} from '@/composables/versioning/use-version-command-bus'
import { DEFAULT_CAPABILITY } from '@/composables/versioning/version-capability'

export { createVersionCommandBus, VERSION_COMMAND_BUS_KEY, VERSION_CONTEXT_KEY }

/**
 * @param {object} [overrides]
 * @returns {Record<symbol, object>}
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
 * @param {ReturnType<typeof createVersionCommandBus>} [bus]
 * @returns {{ bus: ReturnType<typeof createVersionCommandBus>, provide: Record<symbol, object> }}
 */
export const provideVersionCommandBus = (bus = createVersionCommandBus()) => ({
  bus,
  provide: { [VERSION_COMMAND_BUS_KEY]: bus }
})

/**
 * @param {object} component
 * @param {object} [options]
 * @param {object} [options.props]
 * @param {object} [options.contextOverrides]
 * @param {ReturnType<typeof createVersionCommandBus>} [options.bus]
 * @param {object} [options.global]
 * @returns {import('@vue/test-utils').VueWrapper}
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

export const defaultVersionContext = () => provideVersionContext({ readOnly: readonly(ref(false)) })
