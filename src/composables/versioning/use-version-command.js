import { inject, onBeforeUnmount } from 'vue'
import { VERSION_COMMAND_BUS_KEY } from './use-version-command-bus'

/**
 * Registers a command handler on the bus provided by the ancestor VersionShell.
 *
 * Accepts a shorthand (function only) or the full form ({ execute, ready }).
 * Clears the registration automatically on onBeforeUnmount.
 *
 * @param {string} command — canonical name (VERSION_ACTIONS)
 * @param {Function | { execute: Function, ready?: import('vue').Ref<boolean> }} options
 */
export const onVersionCommand = (command, options) => {
  const bus = inject(VERSION_COMMAND_BUS_KEY, null)
  if (!bus) {
    throw new Error('[onVersionCommand] no bus in scope — use inside <VersionShell>')
  }

  const config = typeof options === 'function' ? { execute: options } : options

  const unregister = bus.register(command, config)
  onBeforeUnmount(unregister)
}
