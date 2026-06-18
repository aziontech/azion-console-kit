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

  return { register, emit, registered: shallowReadonly(registered) }
}
