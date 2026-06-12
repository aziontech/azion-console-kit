import { shallowRef, shallowReadonly } from 'vue'

/**
 * Inject key used by the VersionShell to provide the bus to descendants.
 * Children consume it via @/composables/versioning/use-version-command.
 */
export const VERSION_COMMAND_BUS_KEY = Symbol('versionCommandBus')

/**
 * Creates an isolated command bus for a VersionShell instance.
 *
 * Each command supports ONE handler. Registering twice throws.
 * Emitting without a handler throws. `registered` is reactive so the shell
 * can recompute availableActions/disabledActions when children mount/unmount.
 *
 * @returns {{
 *   register: (command: string, opts: { execute: Function, ready?: import('vue').Ref<boolean> }) => () => void,
 *   emit: (command: string, ctx: object) => Promise<any>,
 *   registered: import('vue').Ref<Map<string, { execute: Function, ready: import('vue').Ref<boolean>|null }>>
 * }}
 */
export const createVersionCommandBus = () => {
  // shallowRef, NEVER ref: ref() would turn the Map into a reactive proxy, and
  // reactive proxies unwrap refs on property access — `entry.ready` would
  // become the boolean (not the ref) when iterating, and `entry.ready.value`
  // would be undefined, inverting the disabled gate in the shell. With
  // shallowRef the Map and its entries stay raw; reactivity comes from
  // replacing the whole Map on each register/unregister.
  const registered = shallowRef(new Map())

  const register = (command, { execute, ready = null }) => {
    if (registered.value.has(command)) {
      throw new Error(`[VersionShell] Command "${command}" already registered`)
    }
    const next = new Map(registered.value)
    next.set(command, { execute, ready })
    registered.value = next

    return () => {
      const after = new Map(registered.value)
      after.delete(command)
      registered.value = after
    }
  }

  const emit = async (command, ctx) => {
    const entry = registered.value.get(command)
    if (!entry) {
      throw new Error(`[VersionShell] No handler registered for "${command}"`)
    }
    return entry.execute(ctx)
  }

  // shallowReadonly (not readonly): blocks external reassignment of .value
  // without wrapping the Map/entries in proxies (which would unwrap `ready`).
  return { register, emit, registered: shallowReadonly(registered) }
}
